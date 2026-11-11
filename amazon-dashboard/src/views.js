import { aggregate, metrics, formatMetric as fmt, groupRows, flags, escapeHtml as esc, MAX_RULES } from './core.js';
import { dateBefore } from './mock-data.js';
import { renderKnowledgePage } from './knowledge.js';
import { renderSkuPage } from './sku-view.js';
import { createSkuModels, defaultSkuCycle } from './sku-alerts.js';

export const PAGES = ['业绩总览', '业绩详情', '广告构成', '单品明细', 'AI基础分析', '数据源设置', '权限设置', '广告知识'];
export const DETAIL_KEYS = ['净销售额', '销量', '访客总计', '花费', '广告展现', '点击', 'CTR', 'CVR', 'CPC', 'ACOS', '目标', '达成率'];
export const PRODUCT_KEYS = ['净销售额', '销量', '访客总计', '退款率', '推广占比', '广告展现', '点击', '花费', 'CTR', 'CVR', 'CPC', 'ACOS', '目标', '达成率'];
export const AD_TYPES = [
  { name: 'SP', label: '商品推广', share: 0.58, color: '#367db1' },
  { name: 'SB', label: '品牌推广', share: 0.18, color: '#eea039' },
  { name: 'SD', label: '展示型推广', share: 0.14, color: '#54a4a5' },
  { name: 'SBV', label: '品牌视频广告', share: 0.1, color: '#919bb6' },
];
export function dimensionKey(state) {
  return state.dimension === '国家' ? 'country' : state.dimension === '店铺' ? 'shop' : `category${state.level}`;
}
export function matchingProducts(rows, query) {
  const needle = query.trim().toLowerCase();
  return groupRows(rows, 'sku').filter(row => `${row.name} ${row.raw[0].asin} ${row.raw[0].category3}`.toLowerCase().includes(needle));
}
export function table(rows, keys, thresholds, detail = false) {
  return `<div class="scroll" tabindex="0" aria-label="可横向滚动的数据表"><table><thead><tr><th scope="col">维度 / 产品</th>${keys.map(key => `<th scope="col">${esc(key)}</th>`).join('')}${detail ? '<th scope="col">异常判断</th>' : ''}</tr></thead><tbody>${rows.length ? rows.map(row => {
    const values = metrics(row);
    const problems = detail ? flags(row, thresholds) : [];
    return `<tr><th scope="row">${esc(row.name)}${detail ? `<small>${esc(row.raw[0].category3)}<br>${esc(row.raw[0].asin)} · ${esc(row.raw[0].shop)}</small>` : ''}</th>${keys.map(key => `<td>${fmt(key, values[key])}</td>`).join('')}${detail ? `<td class="flag-cell">${problems.length ? problems.map(key => `<span class="tag red">${esc(key)}</span>`).join('') : '<span class="tag green">正常</span>'}</td>` : ''}</tr>`;
  }).join('') : `<tr><td colspan="${keys.length + (detail ? 2 : 1)}" class="empty">没有匹配的产品，请调整搜索条件。</td></tr>`}</tbody></table></div>`;
}

function trend(rows, period) {
  const totals = new Map(groupRows(rows, 'date').map(row => [row.name, row.revenue]));
  const values = Array.from({ length: period.days }, (_, index) => {
    const date = dateBefore(period.end, period.days - 1 - index);
    return { date, value: totals.get(date) ?? 0 };
  });
  const max = Math.max(...values.map(row => row.value), 1);
  const points = values.map((row, index) => `${60 + index * 620 / Math.max(values.length - 1, 1)},${180 - row.value / max * 145}`);
  return `<svg class="trend" viewBox="0 0 710 220" role="img" aria-label="${esc(period.start)} 至 ${esc(period.end)} 的每日净销售额趋势"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#367db1" stop-opacity="0.2"/><stop offset="100%" stop-color="#367db1" stop-opacity="0"/></linearGradient></defs>${[0, 0.5, 1].map(ratio => `<line x1="60" y1="${180 - ratio * 145}" x2="680" y2="${180 - ratio * 145}" stroke="#e7edf4"/><text x="48" y="${184 - ratio * 145}" text-anchor="end">${Math.round(max * ratio / 1000)}k</text>`).join('')}<polygon points="60,180 ${points.join(' ')} 680,180" fill="url(#chart-fill)"/><polyline fill="none" stroke="#367db1" stroke-width="3" stroke-linejoin="round" points="${points.join(' ')}"/>${values.map((row, index) => `<circle cx="${60 + index * 620 / Math.max(values.length - 1, 1)}" cy="${180 - row.value / max * 145}" r="3" fill="#367db1"><title>${row.date}：${fmt('净销售额', row.value)}</title></circle>`).join('')}<text x="60" y="210">${period.start.slice(5)}</text><text x="680" y="210" text-anchor="end">${period.end.slice(5)}</text></svg>`;
}

function overview(rows, period) {
  const total = aggregate(rows);
  const values = metrics(total);
  const cards = Object.entries(values).filter(([key]) => !['达成率', '目标', '电脑端访客', '手机端访客'].includes(key));
  return `<div class="cards">${cards.map(([key, value], index) => `<section class="card ${index === 0 ? 'featured' : ''}"><span class="metric-label">${esc(key)}</span><strong>${fmt(key, value)}</strong><small>所选期间 · 模拟数据</small></section>`).join('')}</div><div class="split"><section class="panel"><div class="panel-heading"><h2>净销售额趋势</h2><span class="muted">USD · 按日</span></div>${trend(rows, period)}<p class="muted">按日期从早到晚展示；悬停数据点查看当日销售额。</p><details><summary>查看每日销售数据</summary>${table(groupRows(rows, 'date').sort((a, b) => a.name.localeCompare(b.name)), ['净销售额', '销量'])}</details></section><section class="panel goal"><h2>经营目标进度</h2><strong class="goal-value">${fmt('达成率', values.达成率)}</strong><div class="bar" role="img" aria-label="目标达成率 ${fmt('达成率', values.达成率)}"><i style="width:${Math.min(values.达成率 ?? 0, 100)}%"></i></div><p>期间目标 <b>${fmt('目标', total.target)}</b></p><p class="muted">实际净销售额 / 所选期间经营目标</p><button class="primary" data-action="diagnose">查看异常诊断 →</button></section></div>`;
}

function details(rows, state) {
  return `<section class="panel"><div class="panel-heading wrap"><h2>业绩维度分析</h2><div class="inline-controls"><div class="segmented" aria-label="统计维度">${['国家', '店铺', '品类'].map(value => `<button data-dimension="${value}" aria-pressed="${state.dimension === value}" class="${state.dimension === value ? 'selected' : ''}">${value}</button>`).join('')}</div><label>分类层级<select id="level">${[1, 2, 3].map(value => `<option value="${value}" ${state.level === value ? 'selected' : ''}>${value}级分类</option>`).join('')}</select></label></div></div>${table(groupRows(rows, dimensionKey(state)), DETAIL_KEYS)}</section>`;
}

function ads(rows) {
  const total = aggregate(rows);
  return `<section class="panel"><div class="panel-heading"><h2>广告投入结构</h2><strong>${fmt('花费', total.adSpend)}</strong></div><p class="muted">按固定模拟比例拆分，各类型花费之和与总览一致。</p><div class="ad-stack" role="img" aria-label="SP 58%，SB 18%，SD 14%，SBV 10%">${AD_TYPES.map(type => `<span style="width:${type.share * 100}%;background:${type.color}">${type.name}</span>`).join('')}</div>${AD_TYPES.map(type => `<div class="ad-row"><div><b>${type.name}</b><small>${type.label}</small></div><div class="bar"><i style="width:${type.share * 100}%;background:${type.color}"></i></div><strong>${fmt('花费', total.adSpend * type.share)}</strong><span class="muted">${Math.round(type.share * 100)}%</span></div>`).join('')}</section>`;
}

function analysis(rows, state) {
  const groups = groupRows(rows, 'sku');
  const bad = groups.filter(row => flags(row, state.thresholds).length);
  return `<section class="panel"><h2>诊断标准 · 可配置</h2><p class="muted">按当前筛选期间的累计值判断。金额单位 USD，比例单位 %；规则边界值本身视为达标。</p><form id="threshold-form"><div class="threshold-grid">${Object.entries(state.thresholds).map(([key, value]) => `<label>${esc(key)}<span class="muted">${MAX_RULES.has(key) ? '最高值' : '最低值'}</span><input name="${esc(key)}" type="number" min="0" step="any" required value="${value}"></label>`).join('')}</div><div class="form-actions"><button type="submit" class="primary">应用标准并生成诊断</button><button type="button" data-action="reset-thresholds">恢复默认标准</button></div></form></section><section class="panel"><div class="panel-heading"><h2>基础诊断摘要</h2><span class="tag red">${bad.length} 个产品触发规则</span></div><div class="note">发现 ${bad.length} / ${groups.length} 个产品触发规则。摘要由本地规则生成，原因需人工核实，不调用外部 AI。</div><div class="category-summary">${groupRows(rows, `category${state.level}`).map(row => `<p><b>${esc(row.name)}</b><span>${esc(flags(row, state.thresholds).join('、') || '全部达标')}</span></p>`).join('')}</div>${bad.length ? bad.map(row => `<article class="diagnosis"><div class="panel-heading"><h3>${esc(row.name)} <span class="muted">${esc(row.raw[0].category3)}</span></h3><span class="muted">${esc(row.raw[0].shop)}</span></div><p class="red">触发：${esc(flags(row, state.thresholds).join('、'))}</p><p>期间净销售额 ${fmt('净销售额', row.revenue)}，目标达成 ${fmt('达成率', metrics(row).达成率)}，ACOS ${fmt('ACOS', metrics(row).ACOS)}。</p><p class="muted">建议：核对预算和搜索词质量，检查价格、评价与商品页面转化；核实数据与归因后再调整投放。</p></article>`).join('') : '<div class="empty green">当前筛选范围内的产品均未触发已配置规则。</div>'}</section><div class="note">报告更新预览：每周一 09:00（北京时间）。此项目没有后台调度，报告随筛选和标准即时重算。</div>`;
}

function sources(state) {
  return `<section class="panel"><h2>数据源设置</h2><div class="note">当前使用内置虚构数据。尚未连接真实亚马逊账户，也不会收集密钥。</div><div class="source-grid">${['销售与退款报表', '访客与流量报表', '广告报表', '经营目标'].map((name, index) => `<article class="source-card"><span class="source-icon">0${index + 1}</span><h3>${name}</h3><span class="green">● 内置模拟数据已就绪</span></article>`).join('')}</div><form id="frequency-form"><div class="inline-controls"><label>展示更新频率<select name="frequency"><option value="daily" ${state.frequency === 'daily' ? 'selected' : ''}>每日</option><option value="weekly" ${state.frequency === 'weekly' ? 'selected' : ''}>每周</option></select></label><button type="submit">保存演示设置</button></div><p class="muted">此设置仅保存在当前浏览器，不会触发实际同步。</p></form></section>`;
}

function permissions() {
  return `<section class="panel"><h2>权限设置 · 角色预览</h2><div class="note">顶部“查看身份”只用于前端角色演示，不能代替真实身份认证和服务端访问控制。</div><div class="scroll"><table><thead><tr><th scope="col">角色</th><th scope="col">数据范围</th><th scope="col">能力预览</th></tr></thead><tbody><tr><th scope="row">总监</th><td>全部国家与店铺</td><td>经营查看、规则配置</td></tr><tr><th scope="row">副总监</th><td>美国业务</td><td>所辖业务分析、规则配置预览</td></tr><tr><th scope="row">店长</th><td>北美旗舰店</td><td>所辖单品查看、规则配置预览</td></tr></tbody></table></div><p class="muted">演示仅限制数据展示范围，各角色均可试用配置页面。真实授权需要在后端实现。</p></section>`;
}

export function renderPage(rows, state, period) {
  if (!rows.length && [0,1,2,4].includes(state.page)) return '<section class="panel empty"><h2>当前筛选没有数据</h2><p>请调整国家、店铺或品类后重试。</p><button data-action="reset-filters">重置筛选</button></section>';
  switch (state.page) {
    case 0: return overview(rows, period);
    case 1: return details(rows, state);
    case 2: return ads(rows);
    case 3: return renderSkuPage({ ...state, skuModels: state.skuModels ?? createSkuModels(rows, rows, state.skuCycle ?? defaultSkuCycle(), state.skuRules) }, PRODUCT_KEYS);
    case 4: return analysis(rows, state);
    case 5: return sources(state);
    case 6: return permissions();
    case 7: return renderKnowledgePage(state);
    default: return overview(rows, period);
  }
}
