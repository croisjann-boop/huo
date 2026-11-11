import { DATA_END, STORES, createMockRows } from './mock-data.js';
import { DEFAULT_FILTERS, DEFAULT_THRESHOLDS, aggregate, filterRows, periodFor, metrics, groupRows, flags, toCsv, validateThresholds } from './core.js';
import { PAGES, DETAIL_KEYS, PRODUCT_KEYS, AD_TYPES, dimensionKey, matchingProducts, renderPage, table } from './views.js';
import { loadThresholds, loadFrequency, writeSetting } from './storage.js';

const $ = id => document.getElementById(id);
const rows = createMockRows();
const state = { page: 0, dimension: '国家', level: 1, query: '', filters: { ...DEFAULT_FILTERS }, thresholds: loadThresholds(), frequency: loadFrequency() };
let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}
function refreshFilters() {
  const filter = state.filters;
  if (filter.role !== 'director') filter.country = '美国';
  if (filter.role === 'manager') filter.shop = '北美旗舰店';
  const stores = STORES.filter(store => filter.country === 'all' || store.country === filter.country);
  if (filter.shop !== 'all' && !stores.some(store => store.name === filter.shop)) filter.shop = 'all';
  $('country').replaceChildren(...[{ value: 'all', label: '全部国家' }, ...STORES.map(store => ({ value: store.country, label: store.country }))].map(item => new Option(item.label, item.value)));
  $('shop').replaceChildren(new Option('全部店铺', 'all'), ...stores.map(store => new Option(store.name, store.name)));
  for (const key of Object.keys(DEFAULT_FILTERS)) $(key).value = filter[key];
  $('country').disabled = filter.role !== 'director';
  $('shop').disabled = filter.role === 'manager';
}
function render() {
  refreshFilters();
  const filtered = filterRows(rows, state.filters);
  const period = periodFor(state.filters);
  $('title').textContent = PAGES[state.page];
  $('crumb').textContent = PAGES[state.page];
  $('period').textContent = `${period.start} — ${period.end} · ${period.days} 天 · USD`;
  $('nav').innerHTML = PAGES.map((page, index) => `<button type="button" data-page="${index}" ${state.page === index ? 'class="active" aria-current="page"' : ''}><span class="nav-index">0${index + 1}</span>${page}</button>`).join('');
  $('content').innerHTML = renderPage(filtered, state, period);
  $('export').hidden = state.page > 4;
  $('export').disabled = !filtered.length;
}
function resetFilters() {
  // 保留当前预览角色；重置不会扩大店长或副总监的数据范围。
  state.filters = { ...DEFAULT_FILTERS, role: state.filters.role };
  state.query = '';
  render();
}
for (const key of Object.keys(DEFAULT_FILTERS)) {
  $(key).addEventListener('change', event => {
    state.filters[key] = event.target.value;
    if (key === 'role') {
      state.filters.country = state.filters.role === 'director' ? 'all' : '美国';
      state.filters.shop = state.filters.role === 'manager' ? '北美旗舰店' : 'all';
    }
    render();
  });
}
$('reset-filters').addEventListener('click', resetFilters);
$('nav').addEventListener('click', event => {
  const button = event.target.closest('[data-page]');
  if (!button) return;
  state.page = Number(button.dataset.page);
  render();
  $('title').setAttribute('tabindex', '-1');
  $('title').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
});
$('content').addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'diagnose') { state.page = 4; render(); }
  if (action === 'reset-filters') resetFilters();
  if (action === 'reset-thresholds') {
    state.thresholds = { ...DEFAULT_THRESHOLDS };
    const saved = writeSetting('amz-threshold', state.thresholds);
    render();
    toast(saved ? '已恢复并保存默认标准' : '已恢复默认标准；浏览器不允许保存，仅本次有效');
  }
  const dimension = event.target.closest('[data-dimension]')?.dataset.dimension;
  if (dimension) { state.dimension = dimension; render(); }
});
$('content').addEventListener('change', event => {
  if (event.target.id === 'level') { state.level = Number(event.target.value); render(); }
});
$('content').addEventListener('input', event => {
  if (event.target.id !== 'search') return;
  state.query = event.target.value;
  $('products').innerHTML = table(matchingProducts(filterRows(rows, state.filters), state.query), PRODUCT_KEYS, state.thresholds, true);
});
$('content').addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'threshold-form') {
    const values = validateThresholds(Object.fromEntries(new FormData(event.target)));
    if (!values) { toast('请输入完整、有效且不小于 0 的标准'); return; }
    state.thresholds = values;
    const saved = writeSetting('amz-threshold', values);
    render();
    toast(saved ? '诊断标准已保存，报告已更新' : '报告已更新；浏览器不允许保存，仅本次有效');
  }
  if (event.target.id === 'frequency-form') {
    state.frequency = new FormData(event.target).get('frequency');
    toast(writeSetting('amz-frequency', state.frequency) ? '演示设置已保存，不会触发实际同步' : '浏览器不允许保存，此设置仅本次有效');
  }
});

function exportCsv() {
  const filtered = filterRows(rows, state.filters);
  if (!filtered.length) return;
  let header, body;
  if (state.page === 2) {
    header = ['广告类型', '类型说明', '花费 USD', '占比 %'];
    body = AD_TYPES.map(type => [type.name, type.label, aggregate(filtered).adSpend * type.share, type.share * 100]);
  } else {
    const detail = state.page !== 1;
    const keys = detail ? PRODUCT_KEYS : DETAIL_KEYS;
    let groups = detail ? matchingProducts(filtered, state.page === 3 ? state.query : '') : groupRows(filtered, dimensionKey(state));
    if (state.page === 4) groups = groups.filter(row => flags(row, state.thresholds).length);
    header = ['维度', ...(detail ? ['商品名', 'ASIN', '店铺'] : []), ...keys, ...(detail ? ['异常判断'] : [])];
    body = groups.map(row => [row.name, ...(detail ? [row.raw[0].category3, row.raw[0].asin, row.raw[0].shop] : []), ...keys.map(key => metrics(row)[key]), ...(detail ? [flags(row, state.thresholds).join('、') || '正常'] : [])]);
  }
  const period = periodFor(state.filters);
  const scope = [`日期=${period.start}至${DATA_END}`, `国家=${state.filters.country}`, `店铺=${state.filters.shop}`, `品类=${state.filters.category}`, `身份=${state.filters.role}`, '全部为虚构模拟数据；金额 USD；比例单位 %'];
  const blob = new Blob([toCsv([scope, header, ...body])], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `亚马逊看板-${PAGES[state.page]}-${period.start}-${period.end}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('CSV 已导出，金额为 USD，比例为百分数');
}
$('export').addEventListener('click', exportCsv);
render();
