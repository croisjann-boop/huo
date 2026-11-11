import { KNOWLEDGE_DATA } from './knowledge-data.js';
import { escapeHtml } from './core.js';

export const KNOWLEDGE_TABS = [
  { id: 'strategies', label: '投放策略库' },
  { id: 'definitions', label: 'A1–A5 定义与示例' },
  { id: 'why', label: '经营逻辑' },
  { id: 'amc', label: 'AMC 人群与命名' },
  { id: 'guide', label: '字段速查' },
];
export const DEFAULT_KNOWLEDGE_FILTERS = { query: '', stage: 'all', type: 'all', targeting: 'all', recommendation: 'all', priority: 'all', page: 1 };
export const KNOWLEDGE_PAGE_SIZE = 12;
export const KNOWLEDGE_COLUMNS = [
  ['A', '流量类型分类'], ['B', '流量分类'], ['C', '广告类型'], ['D', '广告目的'], ['E', '广告形式'],
  ['F', '定向方式 / 受众'], ['G', '投放内容'], ['H', '匹配方式'], ['I', '投放地方'],
  ['J', '广告组名'], ['K', '出价 / 匹配'], ['L', '广告作用'], ['M', '建组建议'], ['N', '扩流优先级'], ['O', '备注 / 建组说明'],
];

function knowledgeSheet(name) { return KNOWLEDGE_DATA.sheets.find(sheet => sheet.name === name); }
function knowledgeRecord(row) {
  return { row: row.row, ...Object.fromEntries(row.cells.map(cell => [cell.ref.replace(/\d+$/, ''), cell.text])) };
}
const strategySheet = knowledgeSheet('群爆款列表');
const definitionSheet = knowledgeSheet('A1-A5定义');
const audienceSheet = knowledgeSheet('AMC人群自定义');
export const KNOWLEDGE_STRATEGIES = strategySheet.rows.filter(row => row.row > 1).map(knowledgeRecord);
export const KNOWLEDGE_DEFINITIONS = definitionSheet.rows.filter(row => row.row >= 3 && row.row <= 7).map(knowledgeRecord);
export const KNOWLEDGE_EXAMPLES = definitionSheet.rows.filter(row => row.row >= 12 && row.row <= 16).map(knowledgeRecord);
export const KNOWLEDGE_AUDIENCES = audienceSheet.rows.filter(row => row.row >= 3).map(row => ({ ...knowledgeRecord(row), imageId: row.cells.find(cell => cell.imageId)?.imageId }));

function recommendationMatches(value, filter) {
  if (filter === 'all') return true;
  if (filter === 'required') return value?.startsWith('必建');
  if (filter === 'expansion') return value === '长链路扩流';
  return value?.startsWith('看需要');
}
export function filterKnowledgeStrategies(filters = {}) {
  const selected = { ...DEFAULT_KNOWLEDGE_FILTERS, ...filters };
  const terms = selected.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return KNOWLEDGE_STRATEGIES.filter(row => {
    const text = KNOWLEDGE_COLUMNS.map(([key]) => row[key] ?? '').join(' ').toLowerCase();
    return terms.every(term => text.includes(term))
      && (selected.stage === 'all' || row.B === selected.stage)
      && (selected.type === 'all' || row.C === selected.type)
      && (selected.targeting === 'all' || row.F === selected.targeting)
      && recommendationMatches(row.M, selected.recommendation)
      && (selected.priority === 'all' || (selected.priority === 'unmarked' ? !row.N : row.N === selected.priority));
  });
}
export function knowledgePagination(filters) {
  const result = filterKnowledgeStrategies(filters);
  const pageCount = Math.max(1, Math.ceil(result.length / KNOWLEDGE_PAGE_SIZE));
  const page = Math.min(Math.max(Number(filters.page) || 1, 1), pageCount);
  const offset = (page - 1) * KNOWLEDGE_PAGE_SIZE;
  return { result, pageCount, page, offset, rows: result.slice(offset, offset + KNOWLEDGE_PAGE_SIZE) };
}
function knowledgeSource(sheet, range = '') {
  return `<span class="knowledge-source">来源：${escapeHtml(sheet)}${range ? ` · ${escapeHtml(range)}` : ''}</span>`;
}
function knowledgeValue(value) { return value ? escapeHtml(value) : '<span class="muted">原表未填</span>'; }
function knowledgeSelect(key, label, options, filters) {
  return `<label>${label}<select data-knowledge-filter="${key}" aria-label="知识${label}">${options.map(([value, title]) => `<option value="${escapeHtml(value)}" ${filters[key] === value ? 'selected' : ''}>${escapeHtml(title)}</option>`).join('')}</select></label>`;
}

export function renderKnowledgeResults(filters) {
  const { result, rows, page, pageCount, offset } = knowledgePagination(filters);
  return `<div class="knowledge-results-heading"><p id="knowledge-result-count" role="status">共 <b>${result.length}</b> 条策略${result.length ? `，显示第 ${offset + 1}–${offset + rows.length} 条` : ''}</p><button type="button" data-action="export-knowledge" ${result.length ? '' : 'disabled'}>↓ 导出筛选结果</button></div>${rows.length ? `<div class="knowledge-strategies">${rows.map(row => `<details class="knowledge-strategy"><summary><span class="knowledge-stage stage-${row.B}">${escapeHtml(row.B)}</span><div class="knowledge-strategy-title"><strong>${escapeHtml(row.J)}</strong><span>${escapeHtml(row.L || row.G || '')}</span></div><span class="knowledge-type">${escapeHtml(row.C)}${row.E ? ` · ${escapeHtml(row.E)}` : ''}</span><span class="knowledge-recommendation ${row.M?.startsWith('必建') ? 'required' : ''}">${escapeHtml(row.M || '未标注')}</span><span class="knowledge-priority">${escapeHtml(row.N || '—')}</span><span class="knowledge-expand" aria-hidden="true">＋</span></summary><div class="knowledge-strategy-body"><div class="knowledge-detail-heading"><h3>${escapeHtml(row.G || row.J)}</h3><button type="button" data-copy-strategy="${row.row}">复制广告组名</button></div><dl class="knowledge-fields">${KNOWLEDGE_COLUMNS.map(([key, label]) => `<div class="${['J', 'L', 'O'].includes(key) ? 'wide' : ''}"><dt>${label}</dt><dd>${knowledgeValue(row[key])}</dd></div>`).join('')}</dl>${knowledgeSource('群爆款列表', `A${row.row}:O${row.row}`)}</div></details>`).join('')}</div>` : '<div class="empty"><h3>没有匹配的策略</h3><p>可以减少筛选条件，或尝试其他关键词。</p><button type="button" data-action="reset-knowledge">清空筛选</button></div>'}<div class="knowledge-pagination"><span>第 ${page} / ${pageCount} 页</span><div><button type="button" data-knowledge-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>上一页</button><button type="button" data-knowledge-page="${page + 1}" ${page >= pageCount ? 'disabled' : ''}>下一页</button></div></div>`;
}

function renderKnowledgeLibrary(filters) {
  const targeting = [...new Set(KNOWLEDGE_STRATEGIES.map(row => row.F))].sort();
  return `<section class="panel knowledge-library"><div class="knowledge-library-heading"><div><h2>投放策略库</h2><p class="muted">按原表顺序展示。展开策略可查看全部 15 个字段及原表位置。</p></div><button type="button" class="text-button" data-action="reset-knowledge">清空筛选</button></div><div class="knowledge-search"><label for="knowledge-search">搜索策略</label><input id="knowledge-search" type="search" value="${escapeHtml(filters.query)}" placeholder="搜索广告组名、受众、作用或建组说明" autocomplete="off"></div><div class="knowledge-filters">${knowledgeSelect('stage', '流量分类', [['all', '全部流量'], ...KNOWLEDGE_DEFINITIONS.map(row => [row.A, `${row.A} ${row.B}`])], filters)}${knowledgeSelect('type', '广告类型', [['all', '全部类型'], ['SP', 'SP'], ['SB', 'SB（含视频）'], ['SD', 'SD']], filters)}${knowledgeSelect('targeting', '定向方式', [['all', '全部定向'], ...targeting.map(value => [value, value])], filters)}${knowledgeSelect('recommendation', '建组建议', [['all', '全部建议'], ['required', '必建（含条件项）'], ['expansion', '长链路扩流'], ['optional', '看需要']], filters)}${knowledgeSelect('priority', '扩流优先级', [['all', '全部优先级'], ['P1', 'P1 · 最优先'], ['P2', 'P2'], ['P3', 'P3'], ['unmarked', '原表未标注']], filters)}</div><div id="knowledge-results">${renderKnowledgeResults(filters)}</div></section>`;
}

function renderKnowledgeDefinitions() {
  const note = definitionSheet.rows.find(row => row.row === 8).cells[0].text;
  return `<div class="note">${escapeHtml(note)}</div><div class="knowledge-definition-grid">${KNOWLEDGE_DEFINITIONS.map(row => `<article class="panel knowledge-definition"><div class="knowledge-definition-title"><span class="knowledge-stage stage-${row.A}">${escapeHtml(row.A)}</span><h2>${escapeHtml(row.B)}</h2></div><p>${escapeHtml(row.C)}</p><dl><dt>核心任务</dt><dd>${escapeHtml(row.D)}</dd><dt>主要考核</dt><dd>${escapeHtml(row.E)}</dd><dt>典型投放</dt><dd>${escapeHtml(row.F)}</dd></dl>${knowledgeSource('A1-A5定义', `A${row.row}:F${row.row}`)}</article>`).join('')}</div><section class="panel"><h2>以铁皮棚举例</h2><div class="scroll"><table class="knowledge-example-table"><thead><tr><th>流量分类</th><th>投放举例</th><th>为什么这样划分</th></tr></thead><tbody>${KNOWLEDGE_EXAMPLES.map(row => `<tr><th scope="row"><span class="knowledge-stage stage-${row.A}">${row.A}</span></th><td>${escapeHtml(row.B)}</td><td>${escapeHtml(row.D)}</td></tr>`).join('')}</tbody></table></div>${knowledgeSource('A1-A5定义', 'A10:F16')}</section>`;
}

function renderKnowledgeWhy() {
  const rows = knowledgeSheet('Why').rows;
  return `<section class="panel knowledge-reading"><p class="knowledge-eyebrow">经营逻辑</p><h2>${escapeHtml(rows[0].cells[0].text)}</h2>${[1, 3].map(index => `<article><h3>${escapeHtml(rows[index].cells[0].text)}</h3><p class="knowledge-prose">${escapeHtml(rows[index + 1].cells[0].text)}</p></article>`).join('')}${knowledgeSource('Why', 'A1:A6')}</section>`;
}

function renderKnowledgeAudiences() {
  const naming = audienceSheet.rows.find(row => row.row === 1).cells;
  const note = audienceSheet.rows.find(row => row.row === 3).cells.find(cell => cell.ref === 'H3').text;
  return `<section class="panel knowledge-amc-intro"><div class="panel-heading"><h2>${escapeHtml(naming[0].text)}</h2><code>${escapeHtml(naming[1].text)}</code></div><p class="knowledge-prose">${escapeHtml(note)}</p><details class="knowledge-image-details"><summary>查看原表命名示意图</summary><button type="button" class="knowledge-image-link" data-knowledge-image="naming" aria-label="放大命名示意图"><img src="${KNOWLEDGE_DATA.namingImage}" alt="AMC投放内容在广告组字段中的位置，原表截图" loading="lazy"></button></details>${knowledgeSource('AMC人群自定义', 'A1:H3')}</section><div class="knowledge-audience-grid">${KNOWLEDGE_AUDIENCES.map(row => `<article class="panel knowledge-audience"><div class="knowledge-detail-heading"><h2>${escapeHtml(row.A)}</h2><span class="muted">${String(row.row - 2).padStart(2, '0')}</span></div><dl class="knowledge-fields"><div><dt>人群类型</dt><dd>${knowledgeValue(row.C)}</dd></div><div><dt>来源产品</dt><dd>${knowledgeValue(row.D)}</dd></div><div><dt>回溯时间</dt><dd>${knowledgeValue(row.E)}</dd></div><div class="wide"><dt>人群包名称</dt><dd><code>${escapeHtml(row.F || '')}</code></dd></div></dl><details class="knowledge-image-details"><summary>查看创建流程图</summary><button type="button" class="knowledge-image-link" data-knowledge-image="${row.imageId}" aria-label="放大${escapeHtml(row.A)}创建流程图"><img src="${KNOWLEDGE_DATA.images[row.imageId]}" alt="${escapeHtml(row.A)}的创建流程，来自原表 B${row.row}" loading="lazy"></button></details>${knowledgeSource('AMC人群自定义', `A${row.row}:F${row.row}`)}</article>`).join('')}</div>`;
}

function renderKnowledgeGuide() {
  return `<section class="panel"><h2>字段与命名速查</h2><p class="muted">保留“群爆款列表”表头中的缩写、默认项及命名说明。</p><div class="knowledge-guide-grid">${strategySheet.rows[0].cells.map(cell => `<article><span class="knowledge-guide-column">${cell.ref.replace(/\d+$/, '')} 列</span><p class="knowledge-prose">${escapeHtml(cell.text)}</p></article>`).join('')}</div>${knowledgeSource('群爆款列表', 'A1:O1')}</section>`;
}

export function renderKnowledgePage(state) {
  const tab = state.knowledgeTab ?? 'strategies';
  const filters = { ...DEFAULT_KNOWLEDGE_FILTERS, ...state.knowledgeFilters };
  const content = tab === 'definitions' ? renderKnowledgeDefinitions() : tab === 'why' ? renderKnowledgeWhy() : tab === 'amc' ? renderKnowledgeAudiences() : tab === 'guide' ? renderKnowledgeGuide() : renderKnowledgeLibrary(filters);
  return `<div class="knowledge-overview"><div><span class="knowledge-eyebrow">广告运营知识库</span><p>查找投放策略、理解经营定位、查看 AMC 人群创建流程。</p></div><div class="knowledge-stats"><div><strong>${KNOWLEDGE_STRATEGIES.length}</strong><span>投放策略</span></div><div><strong>${KNOWLEDGE_DEFINITIONS.length}</strong><span>流量分类</span></div><div><strong>${KNOWLEDGE_AUDIENCES.length}</strong><span>AMC 人群</span></div><div><strong>${KNOWLEDGE_DATA.source.worksheetCount}</strong><span>来源工作表</span></div></div></div><nav class="knowledge-tabs" aria-label="广告知识分区">${KNOWLEDGE_TABS.map(item => `<button type="button" data-knowledge-tab="${item.id}" aria-pressed="${tab === item.id}" class="${tab === item.id ? 'selected' : ''}">${item.label}</button>`).join('')}</nav>${content}<dialog id="knowledge-image-dialog" class="knowledge-image-dialog" aria-label="Excel 原表配图"><div><span>原表配图</span><button type="button" data-action="close-knowledge-image" autofocus>关闭图片</button></div><img id="knowledge-zoom-image" alt=""></dialog><p class="knowledge-file-source">内容来源：${escapeHtml(KNOWLEDGE_DATA.source.filename)}。展示原表文字、公式已保存的结果及配图；空白字段按原表保留。</p>`;
}
