import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockRows } from '../src/mock-data.js';
import { DEFAULT_FILTERS, DEFAULT_THRESHOLDS, aggregate, metrics, filterRows, groupRows, flags, periodFor, validateThresholds, toCsv, escapeHtml, formatMetric } from '../src/core.js';
import { AD_TYPES, PAGES, renderPage } from '../src/views.js';
const rows = createMockRows();

test('模拟数据共有 30 天 × 18 个 SKU，维度汇总和总览一致', () => {
  assert.equal(rows.length, 540);
  assert.equal(groupRows(rows, 'sku').length, 18);
  const total = aggregate(rows);
  for (const key of ['country', 'shop', 'category1', 'sku']) {
    const groupedTotal = aggregate(groupRows(rows, key));
    for (const field of Object.keys(total)) assert.ok(Math.abs(groupedTotal[field] - total[field]) < 0.000001, field);
  }
});

test('最近 7 天、本月累计和最近 30 天使用准确日期边界', () => {
  assert.deepEqual(periodFor({ days: '7' }), { start: '2026-11-04', end: '2026-11-10', days: 7 });
  assert.deepEqual(periodFor({ days: '30' }), { start: '2026-10-12', end: '2026-11-10', days: 30 });
  assert.deepEqual(periodFor({ days: 'month' }), { start: '2026-11-01', end: '2026-11-10', days: 10 });
  assert.equal(filterRows(rows, { ...DEFAULT_FILTERS, days: '7' }).length, 126);
  assert.equal(filterRows(rows, { ...DEFAULT_FILTERS, days: 'month' }).length, 180);
});

test('身份约束在筛选函数内生效，并与国家、店铺和品类组合', () => {
  const limited = filterRows(rows, { ...DEFAULT_FILTERS, role: 'manager' });
  assert.equal(limited.length, 180);
  assert.ok(limited.every(row => row.shop === '北美旗舰店'));
  assert.equal(filterRows(rows, { ...DEFAULT_FILTERS, role: 'deputy', country: '德国' }).length, 0);
  assert.equal(filterRows(rows, { ...DEFAULT_FILTERS, country: '美国', shop: '欧洲生活馆' }).length, 0);
  assert.ok(filterRows(rows, { ...DEFAULT_FILTERS, category: '家居家具' }).every(row => row.category1 === '家居家具'));
});

test('比率由汇总分子和分母计算，空数据不产生 Infinity 或 NaN', () => {
  const total = aggregate(rows);
  const value = metrics(total);
  assert.equal(value.ACOS, total.adSpend / total.adRevenue * 100);
  assert.equal(value.CTR, total.clicks / total.impressions * 100);
  const empty = metrics(aggregate([]));
  assert.equal(empty.CPC, null);
  assert.equal(empty.ACOS, null);
  assert.equal(formatMetric('CPC', empty.CPC), '—');
  assert.deepEqual(flags(aggregate([]), { ACOS: 0 }), []);
});

test('阈值只接受完整的非负有限数，规则边界不触发', () => {
  assert.deepEqual(validateThresholds(DEFAULT_THRESHOLDS), DEFAULT_THRESHOLDS);
  for (const value of [-1, '', null, false, Infinity, 'wrong']) {
    assert.equal(validateThresholds({ ...DEFAULT_THRESHOLDS, ACOS: value }), null);
  }
  assert.equal(validateThresholds({}), null);
  const row = aggregate(rows);
  const value = metrics(row);
  assert.deepEqual(flags(row, { ACOS: value.ACOS, 净销售额: value.净销售额 }), []);
  assert.deepEqual(flags(row, { ACOS: value.ACOS - 1, 净销售额: value.净销售额 + 1 }), ['ACOS', '净销售额']);
});

test('广告拆分花费总和与总览一致', () => {
  const spend = aggregate(rows).adSpend;
  assert.ok(Math.abs(AD_TYPES.reduce((sum, type) => sum + spend * type.share, 0) - spend) < 0.000001);
});

test('CSV 保留中文 BOM、引号、逗号和换行，并保护公式文本', () => {
  const csv = toCsv([['中文', 'a,b', 'a"b', 'line\nbreak', '=SUM(A1)']]);
  assert.equal(csv, '\uFEFF"中文","a,b","a""b","line\nbreak","\'=SUM(A1)"');
  assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});

test('所有页面可由完整数据和空数据生成；趋势不含非法坐标', () => {
  const state = { dimension: '国家', level: 1, query: '', thresholds: DEFAULT_THRESHOLDS, frequency: 'daily' };
  for (let page = 0; page < PAGES.length; page += 1) {
    for (const data of [rows, []]) {
      const html = renderPage(data, { ...state, page }, periodFor(DEFAULT_FILTERS));
      assert.ok(html.length > 0);
      assert.doesNotMatch(html, /NaN|Infinity|undefined/);
    }
  }
});
