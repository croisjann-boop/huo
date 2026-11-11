import { DATA_END } from './mock-data.js';
import { aggregate } from './core.js';

const DAY_MS = 86400000;
export const DEFAULT_SKU_THRESHOLDS = { greenMin: 90, yellowMin: 70 };
export const SKU_LIGHT_LABELS = { green: '绿灯', yellow: '黄灯', red: '红灯', unknown: '待判断' };
export function validSkuDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
export function validSkuCycle(value) {
  return value && validSkuDate(value.start) && validSkuDate(value.end) && value.start <= value.end;
}
export function defaultSkuCycle(asOf = DATA_END) {
  const end = new Date(`${asOf}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return { start: `${asOf.slice(0, 7)}-01`, end: end.toISOString().slice(0, 10) };
}
export function skuTimeProgress(cycle, asOf = DATA_END) {
  if (!validSkuCycle(cycle) || !validSkuDate(asOf)) return { totalDays: 0, elapsedDays: 0, progress: null, cutOff: asOf };
  const start = Date.parse(`${cycle.start}T00:00:00Z`);
  const end = Date.parse(`${cycle.end}T00:00:00Z`);
  const cutoff = Date.parse(`${asOf}T00:00:00Z`);
  const totalDays = Math.round((end - start) / DAY_MS) + 1;
  const elapsedDays = Math.min(totalDays, Math.max(0, Math.round((cutoff - start) / DAY_MS) + 1));
  return { totalDays, elapsedDays, progress: elapsedDays / totalDays, cutOff: asOf < cycle.end ? asOf : cycle.end };
}
export function validateSkuRule(value) {
  if (!value || typeof value !== 'object') return null;
  const result = {};
  for (const key of ['target', 'greenMin', 'yellowMin']) {
    if (value[key] === '' || value[key] === null || typeof value[key] === 'boolean' || !Number.isFinite(Number(value[key]))) return null;
    result[key] = Number(value[key]);
  }
  if (result.target <= 0 || result.yellowMin < 0 || result.greenMin <= result.yellowMin) return null;
  return result;
}
export function skuIdentity(shop, sku) { return JSON.stringify([shop, sku]); }
export function skuRuleKey(shop, sku, cycle) { return JSON.stringify([shop, sku, cycle.start, cycle.end]); }
export function normalizeSkuSettings(value) {
  const cycle = validSkuCycle(value?.cycle) ? { start: value.cycle.start, end: value.cycle.end } : defaultSkuCycle();
  const rules = {};
  if (value?.version === 1 && value.rules && typeof value.rules === 'object') {
    for (const [key, valueRule] of Object.entries(value.rules)) {
      try {
        const parts = JSON.parse(key);
        const rule = validateSkuRule(valueRule);
        if (Array.isArray(parts) && parts.length === 4 && parts.every(part => typeof part === 'string') && parts[0] && parts[1] && validSkuCycle({start:parts[2],end:parts[3]}) && rule) rules[key] = rule;
      } catch { /* 忽略损坏的本地条目。 */ }
    }
  }
  return { version: 1, cycle, rules };
}

// 完成率和时间进度均使用比例值，最终进度达成比才转换为百分数。
export function evaluateSkuWarning({ actual, target, cycle, asOf = DATA_END, greenMin = 90, yellowMin = 70, dataComplete = true }) {
  const time = skuTimeProgress(cycle, asOf);
  const completion = Number.isFinite(actual) && Number.isFinite(target) && target > 0 ? actual / target : null;
  const result = { ...time, actual, target, completion, dataComplete, pace: null, light: 'unknown', reason: '' };
  if (!validSkuCycle(cycle) || !validSkuDate(asOf)) result.reason = '预警周期无效';
  else if (!time.elapsedDays) result.reason = '周期尚未开始';
  else if (!dataComplete || !Number.isFinite(actual)) result.reason = '已过日期的销售数据不完整';
  else if (!Number.isFinite(target) || target <= 0) result.reason = '请设置大于 0 的整周期目标';
  else if (!Number.isFinite(greenMin) || !Number.isFinite(yellowMin) || yellowMin < 0 || greenMin <= yellowMin) result.reason = '阈值无效：绿灯下限须高于黄灯下限';
  else {
    result.pace = completion / time.progress * 100;
    // 只消除浮点运算噪声；显示时的四舍五入不参与分档。
    const epsilon = Number.EPSILON * Math.max(1, Math.abs(result.pace), greenMin, yellowMin) * 8;
    result.light = result.pace + epsilon >= greenMin ? 'green' : result.pace + epsilon >= yellowMin ? 'yellow' : 'red';
    result.reason = result.light === 'green' ? '达到绿灯下限' : result.light === 'yellow' ? '达到黄灯下限，尚未达到绿灯下限' : '低于黄灯下限';
  }
  return result;
}

function groupSkuRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const id = skuIdentity(row.shop, row.sku);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return groups;
}
export function createSkuModels(sourceRows, salesRows, cycle, rules = {}, targetPlan = [], asOf = DATA_END) {
  if (!validSkuCycle(cycle)) return [];
  const groups = groupSkuRows(sourceRows);
  const sales = groupSkuRows(salesRows);
  const plans = groupSkuRows(targetPlan);
  const time = skuTimeProgress(cycle, asOf);
  return [...groups].map(([id, raw]) => {
    const first = raw[0];
    const ruleKey = skuRuleKey(first.shop, first.sku, cycle);
    const override = validateSkuRule(rules[ruleKey]);
    const actualRows = raw.filter(row => row.date >= cycle.start && row.date <= time.cutOff);
    const dates = new Set(actualRows.filter(row => Number.isFinite(row.revenue) && validSkuDate(row.date)).map(row => row.date));
    const planByDate = new Map((plans.get(id) ?? []).filter(row => validSkuDate(row.date) && row.date >= cycle.start && row.date <= cycle.end && Number.isFinite(row.target) && row.target >= 0).map(row => [row.date, row.target]));
    const defaultTarget = planByDate.size === time.totalDays ? Number([...planByDate.values()].reduce((sum, target) => sum + target, 0).toFixed(2)) : null;
    const target = override?.target ?? defaultTarget;
    const greenMin = override?.greenMin ?? DEFAULT_SKU_THRESHOLDS.greenMin;
    const yellowMin = override?.yellowMin ?? DEFAULT_SKU_THRESHOLDS.yellowMin;
    const actual = actualRows.reduce((sum, row) => sum + (Number.isFinite(row.revenue) ? row.revenue : 0), 0);
    const assessment = evaluateSkuWarning({ actual, target, cycle, asOf, greenMin, yellowMin, dataComplete: dates.size === time.elapsedDays && actualRows.every(row => validSkuDate(row.date) && Number.isFinite(row.revenue)) });
    return { id, name: first.sku, shop: first.shop, asin: first.asin, product: first.category3, raw, sales: aggregate(sales.get(id) ?? []), cycle, asOf, ruleKey, customRule: Boolean(override), defaultTarget, greenMin, yellowMin, ...assessment };
  });
}
export function searchSkuModels(models, query = '') {
  const value = query.trim().toLowerCase();
  return models.filter(item => `${item.name} ${item.asin} ${item.product} ${item.shop}`.toLowerCase().includes(value));
}
export function summarizeSkuWarnings(models) {
  return models.reduce((summary, item) => { summary[item.light] += 1; summary.all += 1; return summary; }, {all:0,red:0,yellow:0,green:0,unknown:0});
}
export function visibleSkuModels(models, query = '', light = 'all') {
  return searchSkuModels(models, query).filter(item => light === 'all' || item.light === light);
}
