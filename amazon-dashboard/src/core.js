import { DATA_END, dateBefore } from './mock-data.js';

export const FIELDS = ['revenue', 'units', 'adSpend', 'clicks', 'impressions', 'adRevenue', 'adOrders', 'desktopVisits', 'mobileVisits', 'refunds', 'target'];
export const DEFAULT_FILTERS = { days: '30', country: 'all', shop: 'all', category: 'all', role: 'director' };
export const DEFAULT_THRESHOLDS = { 达成率: 90, ACOS: 30, 退款率: 5, CTR: 0.3, CPC: 2, 推广占比: 18, 净销售额: 500, 销量: 5, 访客: 50, 展现: 1000, 花费: 300, 点击: 10 };
export const MAX_RULES = new Set(['ACOS', '退款率', 'CPC', '推广占比', '花费']);
export const PERCENT_METRICS = new Set(['推广占比', '退款率', 'CTR', 'CVR', 'ACOS', '达成率']);
const MONEY_METRICS = new Set(['净销售额', '花费', 'CPC', '目标']);
const divide = (numerator, denominator, multiplier = 1) => denominator > 0 ? numerator / denominator * multiplier : null;

export function aggregate(rows) {
  return rows.reduce((result, row) => {
    for (const field of FIELDS) result[field] += row[field] ?? 0;
    return result;
  }, Object.fromEntries(FIELDS.map(field => [field, 0])));
}

export function metrics(row) {
  return {
    净销售额: row.revenue, 销量: row.units,
    推广占比: divide(row.adSpend, row.revenue, 100),
    退款率: divide(row.refunds, row.units, 100),
    电脑端访客: row.desktopVisits, 手机端访客: row.mobileVisits,
    访客总计: row.desktopVisits + row.mobileVisits,
    广告展现: row.impressions, 点击: row.clicks, 花费: row.adSpend,
    CTR: divide(row.clicks, row.impressions, 100),
    CVR: divide(row.adOrders, row.clicks, 100),
    CPC: divide(row.adSpend, row.clicks),
    ACOS: divide(row.adSpend, row.adRevenue, 100),
    目标: row.target, 达成率: divide(row.revenue, row.target, 100),
  };
}

export function formatMetric(key, value) {
  if (!Number.isFinite(value)) return '—';
  return `${MONEY_METRICS.has(key) ? '$' : ''}${value.toLocaleString('en-US', {
    maximumFractionDigits: PERCENT_METRICS.has(key) || key === 'CPC' ? 2 : 0,
  })}${PERCENT_METRICS.has(key) ? '%' : ''}`;
}

export function periodFor(filters, endDate = DATA_END) {
  const days = filters.days === 'month' ? Number(endDate.slice(-2)) : Number(filters.days);
  return { start: dateBefore(endDate, days - 1), end: endDate, days };
}

// 角色限制必须在数据筛选中生效，不能只依赖下拉框的禁用状态。
// 这里只提供前端角色预览；生产环境仍须由服务端鉴权。
export function filterRows(rows, filters, endDate = DATA_END) {
  const period = periodFor(filters, endDate);
  return filterScopeRows(rows, filters).filter(row => row.date >= period.start && row.date <= period.end);
}
export function filterScopeRows(rows, filters) {
  return rows.filter(row => (filters.role === 'director' || row.country === '美国')
    && (filters.role !== 'manager' || row.shop === '北美旗舰店')
    && (filters.country === 'all' || row.country === filters.country)
    && (filters.shop === 'all' || row.shop === filters.shop)
    && (filters.category === 'all' || row.category1 === filters.category));
}

export function groupRows(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const name = row[key];
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  return [...groups].map(([name, raw]) => ({ name, ...aggregate(raw), raw }));
}

export function validateThresholds(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const result = {};
  for (const key of Object.keys(DEFAULT_THRESHOLDS)) {
    const value = input[key];
    if (value === '' || value === null || typeof value === 'boolean' || !Number.isFinite(Number(value)) || Number(value) < 0) return null;
    result[key] = Number(value);
  }
  return result;
}

export function flags(row, thresholds) {
  const values = metrics(row);
  return Object.entries(thresholds).filter(([key, threshold]) => {
    const value = values[key === '访客' ? '访客总计' : key === '展现' ? '广告展现' : key];
    if (!Number.isFinite(value)) return false;
    return MAX_RULES.has(key) ? value > threshold : value < threshold;
  }).map(([key]) => key);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function csvCell(value) {
  let text = String(value ?? '');
  // 导出维度文本时，阻止电子表格将其作为公式执行。
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
