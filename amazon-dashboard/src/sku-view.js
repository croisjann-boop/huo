import { targetImportControls } from './target-import.js';
import { DATA_END } from './mock-data.js';
import { escapeHtml, metrics, formatMetric } from './core.js';
import { DEFAULT_SKU_THRESHOLDS, SKU_LIGHT_LABELS, defaultSkuCycle, skuTimeProgress, searchSkuModels, summarizeSkuWarnings, visibleSkuModels } from './sku-alerts.js';

function skuRatio(value) { return formatMetric('达成率', Number.isFinite(value) ? value * 100 : null); }
function skuPace(value) { return formatMetric('达成率', value); }
function skuLightBadge(item) {
  return `<span class="sku-light sku-light-${item.light}" title="${escapeHtml(item.reason)}"><i aria-hidden="true"></i>${SKU_LIGHT_LABELS[item.light]}</span>`;
}
export function renderSkuSummary(state) {
  const items = searchSkuModels(state.skuModels ?? [], state.query ?? '');
  const totals = summarizeSkuWarnings(items);
  const selected = state.skuLight ?? 'all';
  return `<div class="sku-summary-heading"><h2>红黄绿预警汇总</h2><button type="button" data-sku-light="all" aria-pressed="${selected === 'all'}" class="${selected === 'all' ? 'selected' : ''}">全部 SKU <b>${totals.all}</b></button></div><div class="sku-summary-cards" role="group" aria-label="按 SKU 预警灯色筛选">${['red','yellow','green','unknown'].map(light => `<button type="button" data-sku-light="${light}" aria-pressed="${selected === light}" class="sku-summary-card sku-summary-${light} ${selected === light ? 'selected' : ''}"><span><i aria-hidden="true"></i>${SKU_LIGHT_LABELS[light]}</span><strong>${totals[light]}</strong><small>${light === 'unknown' ? '目标或数据不足' : '点击筛选查看'}</small></button>`).join('')}</div><p class="muted sku-summary-hint">汇总随国家、店铺、品类和搜索变化。点击灯色筛选；各灯色数量不受当前灯色筛选影响。</p>`;
}

export function renderSkuResults(state, salesKeys) {
  const items = visibleSkuModels(state.skuModels ?? [], state.query ?? '', state.skuLight ?? 'all');
  return `<div class="sku-results-meta" role="status">当前显示 <b>${items.length}</b> 个 SKU${state.skuLight && state.skuLight !== 'all' ? ` · ${SKU_LIGHT_LABELS[state.skuLight]}` : ''}<span>先查看预警列，横向滚动可查看原有销售与广告指标。</span></div><div class="scroll sku-table-wrap" tabindex="0" aria-label="SKU 预警和销售广告明细，可横向滚动"><table class="sku-table"><thead><tr><th scope="col">SKU / 商品</th><th scope="col">预警灯色</th><th scope="col">周期完成率</th><th scope="col">时间进度</th><th scope="col">进度达成比</th><th scope="col">整周期目标</th><th scope="col">周期已完成额</th><th scope="col">单 SKU 判断规则</th>${salesKeys.map(key => `<th scope="col">${escapeHtml(key)}</th>`).join('')}</tr></thead><tbody>${items.length ? items.map(item => {
    const values = metrics(item.sales);
    return `<tr data-sku-id="${escapeHtml(item.id)}" class="sku-row-${item.light}"><th scope="row"><div class="sku-product-heading"><b>${escapeHtml(item.name)}</b><button type="button" class="sku-inline-rule" data-sku-rule="${escapeHtml(item.id)}">设置规则</button></div><small>${escapeHtml(item.product)} · ${escapeHtml(item.shop)}<br>${escapeHtml(item.asin)}</small></th><td>${skuLightBadge(item)}${item.light === 'unknown' ? `<small class="sku-cell-note">${escapeHtml(item.reason)}</small>` : ''}</td><td>${skuRatio(item.completion)}</td><td>${skuRatio(item.progress)}<small class="sku-cell-note">${item.elapsedDays} / ${item.totalDays} 天</small></td><td><strong class="sku-pace-${item.light}">${skuPace(item.pace)}</strong></td><td>${formatMetric('目标', item.target)}<small class="sku-cell-note">${item.customRule ? '该 SKU 自定义' : item.importedTarget ? 'CSV 导入目标' : '模拟日目标计划'}</small></td><td>${formatMetric('净销售额', item.actual)}<small class="sku-cell-note">截至 ${escapeHtml(item.cutOff)}</small></td><td><small class="sku-cell-note">绿 ≥${item.greenMin}%<br>黄 ≥${item.yellowMin}% 且 &lt;${item.greenMin}%<br>红 &lt;${item.yellowMin}%</small></td>${salesKeys.map(key => `<td>${formatMetric(key, values[key])}</td>`).join('')}</tr>`;
  }).join('') : `<tr><td colspan="${salesKeys.length + 8}" class="empty"><h3>没有匹配的 SKU</h3><p>可切换“全部 SKU”、清空搜索或调整国家、店铺和品类。</p></td></tr>`}</tbody></table></div>`;
}

export function renderSkuPage(state, salesKeys) {
  const cycle = state.skuCycle ?? defaultSkuCycle();
  const time = skuTimeProgress(cycle);
  return `<section class="panel sku-cycle-panel"><div class="panel-heading wrap"><div><h2>SKU 经营进度预警</h2><p class="muted">完成率 ÷ 时间进度 = 进度达成比，按每个 SKU 的规则判定红黄绿。</p></div><span class="sku-asof">数据截止 ${DATA_END}</span></div>${targetImportControls()}<form id="sku-cycle-form" class="sku-cycle-form"><label>周期开始<input type="date" name="start" value="${cycle.start}" required></label><label>周期结束<input type="date" name="end" value="${cycle.end}" required></label><button class="primary" type="submit">应用预警周期</button><div class="sku-time-progress"><span>时间进度 <b>${skuRatio(time.progress)}</b></span><small>已过 ${time.elapsedDays} / ${time.totalDays} 天（含首尾日）</small></div></form><div class="sku-formula"><span>完成率 = 周期内累计净销售额 ÷ 整周期目标</span><span>时间进度 = 已过天数 ÷ 周期总天数</span><b>默认：绿 ≥90%，黄 ≥70% 且 &lt;90%，红 &lt;70%</b></div><p class="muted sku-cycle-note">预警按此处周期独立计算，销售与广告指标仍按顶部时间筛选。默认整周期目标来自模拟日目标计划；可逐 SKU 修改。目标缺失、周期未开始或已过日期数据不完整时显示“待判断”。</p></section><section class="panel sku-products-panel"><div id="sku-summary">${renderSkuSummary(state)}</div><div class="panel-heading wrap sku-search-heading"><h2>SKU / ASIN 预警明细</h2><label class="search-label">搜索<input id="search" type="search" placeholder="SKU、ASIN、商品名或店铺" value="${escapeHtml(state.query ?? '')}" autocomplete="off"></label></div><div id="products">${renderSkuResults(state, salesKeys)}</div></section><dialog id="sku-rule-dialog" class="sku-rule-dialog" aria-label="单个 SKU 判断规则"></dialog>`;
}

export function renderSkuRuleDialog(item) {
  const greenMin = item.greenMin ?? DEFAULT_SKU_THRESHOLDS.greenMin;
  const yellowMin = item.yellowMin ?? DEFAULT_SKU_THRESHOLDS.yellowMin;
  return `<form id="sku-rule-form" data-sku-id="${escapeHtml(item.id)}"><header><div><p class="muted">单个 SKU 判断规则</p><h2>${escapeHtml(item.name)} · ${escapeHtml(item.product)}</h2><p>${escapeHtml(item.shop)}<br>${item.cycle.start} — ${item.cycle.end}</p></div><button type="button" data-action="close-sku-rule" aria-label="关闭 SKU 规则">×</button></header><div class="note">规则只对这个店铺、SKU 和当前预警周期生效，保存在当前浏览器。${item.defaultTarget > 0 ? `默认计划目标 ${formatMetric('目标', item.defaultTarget)}。` : '当前周期没有完整的模拟目标计划，请输入整周期目标。'}</div><div class="sku-rule-inputs"><label class="wide">整周期净销售额目标（USD）<input type="number" name="target" min="0.01" step="any" value="${Number.isFinite(item.target) ? item.target : ''}" required autofocus><small>填写整个周期的目标，不按已过天数折算。</small></label><label>绿灯下限（%）<input type="number" name="greenMin" min="0" step="any" value="${greenMin}" required></label><label>黄灯下限（%）<input type="number" name="yellowMin" min="0" step="any" value="${yellowMin}" required></label></div><p class="muted">进度达成比 ≥绿灯下限为绿灯；≥黄灯下限且低于绿灯下限为黄灯；其余为红灯。绿灯下限必须高于黄灯下限。</p><div id="sku-rule-preview" class="sku-rule-preview" role="status">${renderSkuRulePreview(item)}</div><p id="sku-rule-error" class="red" role="alert" hidden></p><div class="form-actions"><button class="primary" type="submit">保存并重算预警</button><button type="button" data-action="reset-sku-rule">恢复该 SKU 默认规则</button><button type="button" data-action="close-sku-rule">取消</button></div></form>`;
}
export function renderSkuRulePreview(item) {
  return `${skuLightBadge(item)}<span>完成率 <b>${skuRatio(item.completion)}</b> ÷ 时间进度 <b>${skuRatio(item.progress)}</b> = <strong>${skuPace(item.pace)}</strong></span><small>${escapeHtml(item.reason)}；按未四舍五入的原值判断。</small>`;
}
