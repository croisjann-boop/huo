import { validateTargetCsv, applyTargetRecords } from './target-import.js';
import { escapeHtml } from './core.js';
import { skuRuleKey } from './sku-alerts.js';
import { DATA_END, STORES, createMockRows, createMockTargetPlan } from './mock-data.js';
import { DEFAULT_FILTERS, DEFAULT_THRESHOLDS, aggregate, filterRows, filterScopeRows, periodFor, metrics, groupRows, flags, toCsv, validateThresholds } from './core.js';
import { PAGES, DETAIL_KEYS, PRODUCT_KEYS, AD_TYPES, dimensionKey, matchingProducts, renderPage, table } from './views.js';
import { loadThresholds, loadFrequency, readSetting, writeSetting } from './storage.js';
import { DEFAULT_KNOWLEDGE_FILTERS, KNOWLEDGE_COLUMNS, KNOWLEDGE_STRATEGIES, filterKnowledgeStrategies, renderKnowledgeResults } from './knowledge.js';
import { KNOWLEDGE_DATA } from './knowledge-data.js';
import { createSkuModels, normalizeSkuSettings, validSkuCycle, validateSkuRule, evaluateSkuWarning, visibleSkuModels, SKU_LIGHT_LABELS } from './sku-alerts.js';
import { renderSkuSummary, renderSkuResults, renderSkuRuleDialog, renderSkuRulePreview } from './sku-view.js';

const $ = id => document.getElementById(id);
const rows = createMockRows();
const skuTargetPlan = createMockTargetPlan();
let targetRecords = [];
try { const saved=readSetting('amz-target-import-v1',[]); if(Array.isArray(saved)&&saved.length){const csv=toCsv([['店铺','SKU','周期开始','周期结束','目标金额'],...saved.map(r=>[r.shop,r.sku,r.start,r.end,r.target])]);targetRecords=validateTargetCsv(csv,rows).records;} } catch { /* 忽略损坏的导入记录。 */ }
const savedSkuSettings = normalizeSkuSettings(readSetting('amz-sku-warnings-v1', null));
const state = { page: window.location.hash === '#advertising-knowledge' ? 7 : window.location.hash === '#sku-details' ? 3 : 0, dimension: '国家', level: 1, query: '', filters: { ...DEFAULT_FILTERS }, thresholds: loadThresholds(), frequency: loadFrequency(), knowledgeTab: 'strategies', knowledgeFilters: { ...DEFAULT_KNOWLEDGE_FILTERS }, skuCycle:savedSkuSettings.cycle,skuRules:savedSkuSettings.rules,skuModels:[],skuLight:'all' };
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
  const filtered = filterRows(applyTargetRecords(rows,targetRecords), state.filters);
  const period = periodFor(state.filters);
  $('title').textContent = PAGES[state.page];
  $('crumb').textContent = PAGES[state.page];
  const isKnowledge = state.page === 7;
  $('period').textContent = isKnowledge ? '投放策略、经营分类与 AMC 人群手册' : `${period.start} — ${period.end} · ${period.days} 天 · USD`;
  $('sales-filters').hidden = isKnowledge;
  $('sales-footnote').hidden = isKnowledge;
  $('data-badge').textContent = isKnowledge ? 'Excel 广告知识库' : '● 虚构模拟数据';
  $('nav').innerHTML = PAGES.map((page, index) => `<button type="button" data-page="${index}" ${state.page === index ? 'class="active" aria-current="page"' : ''}><span class="nav-index">0${index + 1}</span>${page}</button>`).join('');
  if (state.page === 3) refreshSkuModels();
  $('content').innerHTML = renderPage(filtered, state, period);
  $('export').hidden = state.page > 4;
  $('export').disabled = state.page === 3 ? !visibleSkuModels(state.skuModels,state.query,state.skuLight).length : !filtered.length;
}
function refreshSkuModels() {
  state.skuModels = createSkuModels(filterScopeRows(applyTargetRecords(rows,targetRecords),state.filters),filterRows(applyTargetRecords(rows,targetRecords),state.filters),state.skuCycle,state.skuRules,applyTargetRecords(skuTargetPlan,targetRecords),DATA_END);
  state.skuModels.forEach(item=>{item.importedTarget=targetRecords.some(r=>r.shop===item.shop&&r.sku===item.name&&r.start<=item.cycle.end&&r.end>=item.cycle.start);});
}
function refreshSkuDetails() {
  refreshSkuModels();
  $('sku-summary').innerHTML = renderSkuSummary(state);
  $('products').innerHTML = renderSkuResults(state,PRODUCT_KEYS);
  $('export').disabled = !visibleSkuModels(state.skuModels,state.query,state.skuLight).length;
}
function persistSkuSettings() {
  return writeSetting('amz-sku-warnings-v1',{version:1,cycle:state.skuCycle,rules:state.skuRules});
}
function resetFilters() {
  // 保留当前预览角色；重置不会扩大店长或副总监的数据范围。
  state.filters = { ...DEFAULT_FILTERS, role: state.filters.role };
  state.query = '';
  state.skuLight = 'all';
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
  if (['#advertising-knowledge','#sku-details'].includes(window.location.hash) || [3,7].includes(state.page)) {
    try { history.replaceState(null, '', state.page === 7 ? '#advertising-knowledge' : state.page === 3 ? '#sku-details' : window.location.pathname + window.location.search); } catch { /* 本地文件浏览器可能限制 history API。 */ }
  }
  render();
  $('title').setAttribute('tabindex', '-1');
  $('title').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
});
$('content').addEventListener('click', event => {
  const targetAction=event.target.closest('[data-action]')?.dataset.action;
  if(targetAction==='import-targets'){openTargetImport();return;}
  if(targetAction==='target-template'){downloadTargetTemplate();return;}
  const skuLight = event.target.closest('[data-sku-light]')?.dataset.skuLight;
  if (skuLight) { state.skuLight=skuLight; refreshSkuDetails(); return; }
  const skuId = event.target.closest('[data-sku-rule]')?.dataset.skuRule;
  if (skuId) {
    const item=state.skuModels.find(model=>model.id===skuId);
    if (item) { $('sku-rule-dialog').innerHTML=renderSkuRuleDialog(item); $('sku-rule-dialog').showModal(); }
    return;
  }
  const knowledgeTab = event.target.closest('[data-knowledge-tab]')?.dataset.knowledgeTab;
  if (knowledgeTab) { state.knowledgeTab = knowledgeTab; render(); return; }
  const knowledgePage = event.target.closest('[data-knowledge-page]')?.dataset.knowledgePage;
  if (knowledgePage) {
    state.knowledgeFilters.page = Number(knowledgePage);
    $('knowledge-results').innerHTML = renderKnowledgeResults(state.knowledgeFilters);
    $('knowledge-results').scrollIntoView({ block: 'start' });
    return;
  }
  const copyRow = event.target.closest('[data-copy-strategy]')?.dataset.copyStrategy;
  if (copyRow) {
    const strategy = KNOWLEDGE_STRATEGIES.find(row => row.row === Number(copyRow));
    if (strategy) navigator.clipboard?.writeText(strategy.J).then(() => toast('广告组名已复制')).catch(() => toast('浏览器不允许复制，请选中广告组名手动复制'));
    if (!navigator.clipboard) toast('浏览器不支持复制，请选中广告组名手动复制');
    return;
  }
  const imageId = event.target.closest('[data-knowledge-image]')?.dataset.knowledgeImage;
  if (imageId) {
    const source = imageId === 'naming' ? KNOWLEDGE_DATA.namingImage : KNOWLEDGE_DATA.images[imageId];
    if (source) {
      $('knowledge-zoom-image').src = source;
      $('knowledge-zoom-image').alt = event.target.closest('[data-knowledge-image]').querySelector('img').alt;
      $('knowledge-image-dialog').showModal();
    }
    return;
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'close-sku-rule') { $('sku-rule-dialog').close(); return; }
  if (action === 'reset-sku-rule') {
    const item=state.skuModels.find(model=>model.id===$('sku-rule-form').dataset.skuId);
    if (!item) return;
    delete state.skuRules[item.ruleKey];
    const saved=persistSkuSettings();
    $('sku-rule-dialog').close();
    render();
    toast(saved?'已恢复该 SKU 当前周期的默认规则':'默认规则已恢复；浏览器不允许保存，仅本次有效');
    return;
  }
  if (action === 'close-knowledge-image') { $('knowledge-image-dialog').close(); return; }
  if (action === 'reset-knowledge') { state.knowledgeFilters = { ...DEFAULT_KNOWLEDGE_FILTERS }; render(); return; }
  if (action === 'export-knowledge') { exportKnowledgeCsv(); return; }
  if (action === 'diagnose') { state.page = 4; render(); }
  if (action === 'reset-filters') resetFilters();
  if (action === 'reset-thresholds') {
    state.thresholds = { ...DEFAULT_THRESHOLDS };
    const saved = writeSetting('amz-threshold', state.thresholds);
    render();
    toast(saved ? '已恢复并保存默认标准' : '已恢复默认标准；浏览器不允许保存，仅本次有效');
  }
  const dimension = event.target.closest('[data-dimension]')?.dataset.dimension;
  if (dimension) { state.dimension = dimension; const level=event.target.closest('[data-category-level]')?.dataset.categoryLevel;if(level)state.level=Number(level);render(); }
});
$('content').addEventListener('change', event => {
  const filter = event.target.dataset.knowledgeFilter;
  if (filter && Object.hasOwn(DEFAULT_KNOWLEDGE_FILTERS, filter)) {
    state.knowledgeFilters[filter] = event.target.value;
    state.knowledgeFilters.page = 1;
    $('knowledge-results').innerHTML = renderKnowledgeResults(state.knowledgeFilters);
    return;
  }
  if (event.target.id === 'level') { state.level = Number(event.target.value); render(); }
});
$('content').addEventListener('input', event => {
  const skuForm=event.target.closest('#sku-rule-form');
  if (skuForm) {
    const item=state.skuModels.find(model=>model.id===skuForm.dataset.skuId);
    const rule=validateSkuRule(Object.fromEntries(new FormData(skuForm)));
    $('sku-rule-error').hidden=true;
    if (item && rule) {
      const preview=evaluateSkuWarning({actual:item.actual,cycle:item.cycle,asOf:item.asOf,dataComplete:item.dataComplete,...rule});
      $('sku-rule-preview').innerHTML=renderSkuRulePreview({...item,...rule,...preview});
    } else $('sku-rule-preview').textContent='请输入正数目标，且绿灯下限必须高于黄灯下限。';
    return;
  }
  if (event.target.id === 'knowledge-search') {
    state.knowledgeFilters.query = event.target.value;
    state.knowledgeFilters.page = 1;
    $('knowledge-results').innerHTML = renderKnowledgeResults(state.knowledgeFilters);
    return;
  }
  if (event.target.id !== 'search') return;
  state.query = event.target.value;
  refreshSkuDetails();
});
$('content').addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'sku-cycle-form') {
    const cycle=Object.fromEntries(new FormData(event.target));
    if (!validSkuCycle(cycle)) { toast('请输入有效周期，结束日期不能早于开始日期'); return; }
    state.skuCycle={start:cycle.start,end:cycle.end};
    const saved=persistSkuSettings();
    render();
    toast(saved?'预警周期已保存，所有 SKU 已重算':'预警周期已应用；浏览器不允许保存，仅本次有效');
    return;
  }
  if (event.target.id === 'sku-rule-form') {
    const item=state.skuModels.find(model=>model.id===event.target.dataset.skuId);
    const rule=validateSkuRule(Object.fromEntries(new FormData(event.target)));
    if (!item || !rule) { $('sku-rule-error').hidden=false; $('sku-rule-error').textContent='保存失败：目标必须大于 0，绿灯下限必须高于黄灯下限，且所有值必须有效。'; return; }
    state.skuRules[item.ruleKey]=rule;
    const saved=persistSkuSettings();
    $('sku-rule-dialog').close();
    render();
    toast(saved?`${item.name} 当前周期规则已保存，预警已重算`:'预警已重算；浏览器不允许保存，仅本次有效');
    return;
  }
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
  let filtered = filterRows(applyTargetRecords(rows,targetRecords), state.filters);
  if (!filtered.length && state.page !== 3) return;
  let header, body;
  if (state.page === 3) {
    refreshSkuModels();
    const items=visibleSkuModels(state.skuModels,state.query,state.skuLight);
    if (!items.length) return;
    header=['SKU','商品名','ASIN','店铺','预警灯色','判断说明','周期开始','周期结束','数据截止','周期已完成额 USD','整周期目标 USD','周期完成率 %','时间进度 %','进度达成比 %','已过天数','周期总天数','绿灯下限 %','黄灯下限 %','规则来源',...PRODUCT_KEYS];
    body=items.map(item=>[item.name,item.product,item.asin,item.shop,SKU_LIGHT_LABELS[item.light],item.reason,item.cycle.start,item.cycle.end,item.asOf,item.actual,item.target,Number.isFinite(item.completion)?item.completion*100:null,item.progress*100,item.pace,item.elapsedDays,item.totalDays,item.greenMin,item.yellowMin,item.customRule?'该 SKU 自定义':'默认规则与模拟日目标计划',...PRODUCT_KEYS.map(key=>metrics(item.sales)[key])]);
  } else if (state.page === 2) {
    header = ['广告类型', '类型说明', '花费 USD', '占比 %'];
    body = AD_TYPES.map(type => [type.name, type.label, aggregate(filtered).adSpend * type.share, type.share * 100]);
  } else {
    const detail = state.page !== 1;
    const keys = detail ? PRODUCT_KEYS : DETAIL_KEYS;
    let groups = detail ? matchingProducts(filtered, state.page === 3 ? state.query : '') : groupRows(filtered, 'country');
    if (state.page === 4) groups = groups.filter(row => flags(row, state.thresholds).length);
    header = ['维度', ...(detail ? ['商品名', 'ASIN', '店铺'] : []), ...keys, ...(detail ? ['异常判断'] : [])];
    body = groups.map(row => [row.name, ...(detail ? [row.raw[0].category3, row.raw[0].asin, row.raw[0].shop] : []), ...keys.map(key => metrics(row)[key]), ...(detail ? [flags(row, state.thresholds).join('、') || '正常'] : [])]);
  }
  const period = periodFor(state.filters);
  const scope = [`日期=${period.start}至${DATA_END}`, `国家=${state.filters.country}`, `店铺=${state.filters.shop}`, `品类=${state.filters.category}`, `身份=${state.filters.role}`, '全部为虚构模拟数据；金额 USD；比例单位 %'];
  if (state.page === 3) scope.push(`预警周期=${state.skuCycle.start}至${state.skuCycle.end}`,`预警灯色筛选=${state.skuLight}`,`搜索=${state.query}`);
  const blob = new Blob([toCsv([scope, header, ...body])], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `亚马逊看板-${PAGES[state.page]}-${period.start}-${period.end}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('CSV 已导出，金额为 USD，比例为百分数');
}

function exportKnowledgeCsv() {
  const strategies = filterKnowledgeStrategies(state.knowledgeFilters);
  if (!strategies.length) return;
  const matrix = [
    ['来源文件', KNOWLEDGE_DATA.source.filename, '工作表', '群爆款列表'],
    [...KNOWLEDGE_COLUMNS.map(([, title]) => title), '原表行号'],
    ...strategies.map(row => [...KNOWLEDGE_COLUMNS.map(([key]) => row[key] ?? ''), row.row]),
  ];
  const url = URL.createObjectURL(new Blob([toCsv(matrix)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `广告知识-投放策略-${strategies.length}条.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`已导出 ${strategies.length} 条策略，包含全部字段和原表行号`);
}
$('export').addEventListener('click', exportCsv);
render();

// 两个看板共享按店铺、SKU 和周期保存的目标计划。
const targetDialog=document.createElement('dialog');
targetDialog.className='target-import-dialog';
targetDialog.setAttribute('aria-label','批量导入经营目标');
document.body.append(targetDialog);
let pendingTargets=null;
function downloadTargetTemplate(){
  const cycle=state.page===3?state.skuCycle:periodFor(state.filters);
  const catalog=[...new Map(filterScopeRows(rows,state.filters).map(r=>[JSON.stringify([r.shop,r.sku]),r])).values()];
  const plan=applyTargetRecords(skuTargetPlan,targetRecords);
  const matrix=[['店铺','SKU','周期开始','周期结束','目标金额'],...catalog.map(r=>{
    const total=plan.filter(p=>p.shop===r.shop&&p.sku===r.sku&&p.date>=cycle.start&&p.date<=cycle.end).reduce((sum,p)=>sum+p.target,0);
    return [r.shop,r.sku,cycle.start,cycle.end,Number(total.toFixed(2))||10000];
  })];
  const url=URL.createObjectURL(new Blob([toCsv(matrix)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='经营目标导入模板.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function openTargetImport(){
  pendingTargets=null;
  targetReadVersion++;
  targetDialog.innerHTML=`<header><h2>批量导入经营目标</h2><button type="button" data-target-close aria-label="关闭">×</button></header><p>两个看板共用目标。按“店铺 + SKU + 周期”导入整周期目标，金额单位 USD；业绩总览按周期天数分配到每天，随筛选汇总。单品明细使用所选预警周期的目标。</p><p>相同周期覆盖旧目标；未导入的 SKU 保留原目标。CSV 内与已有导入周期均不可交叉重叠。匹配周期的单 SKU 目标将被覆盖，灯色阈值保留。</p><button type="button" data-target-template>下载目标模板</button> <button type="button" data-target-reset>清除已导入目标</button><label class="target-file-label">选择 CSV 文件<input type="file" accept=".csv,text/csv" id="target-csv-file"></label><p class="muted">支持 UTF-8 / GB18030 编码；请保留模板列名与店铺、SKU，仅修改日期和目标金额。目标只保存在当前浏览器。</p><div id="target-import-preview" role="status"></div><div class="form-actions"><button type="button" class="primary" id="target-import-confirm" disabled>确认导入</button><button type="button" data-target-close>取消</button></div>`;
  targetDialog.showModal();
}
targetDialog.addEventListener('click',event=>{
  if(event.target.closest('[data-target-close]')){targetReadVersion++;targetDialog.close();}
  if(event.target.closest('[data-target-reset]')){if(!writeSetting('amz-target-import-v1',[])){toast('无法保存，清除未应用');return;}targetRecords=[];pendingTargets=null;targetReadVersion++;targetDialog.close();render();toast('已清除 CSV 目标，恢复默认日目标计划；单 SKU 手动规则保留');return;}
  if(event.target.closest('[data-target-template]'))downloadTargetTemplate();
  if(event.target.id==='target-import-confirm'&&pendingTargets){
    const nextRules={...state.skuRules};
    for(const r of pendingTargets.records){const key=skuRuleKey(r.shop,r.sku,r);if(nextRules[key])nextRules[key]={...nextRules[key],target:r.target};}
    if(!writeSetting('amz-target-import-v1',pendingTargets.merged)){toast('浏览器无法保存目标，导入未应用');return;}
    targetRecords=pendingTargets.merged;state.skuRules=nextRules;persistSkuSettings();
    const cycles=new Set(pendingTargets.records.map(r=>r.start+'|'+r.end));
    if(state.page===3&&cycles.size===1){const r=pendingTargets.records[0];state.skuCycle={start:r.start,end:r.end};persistSkuSettings();}
    const count=pendingTargets.records.length;targetDialog.close();render();toast(`已导入 ${count} 条目标，两个看板已更新`);
  }
});
let targetReadVersion=0;
targetDialog.addEventListener('change',async event=>{
  if(event.target.id!=='target-csv-file')return;
  const version=++targetReadVersion,file=event.target.files[0];pendingTargets=null;
  const preview=targetDialog.querySelector('#target-import-preview'),confirm=targetDialog.querySelector('#target-import-confirm');confirm.disabled=true;preview.textContent='正在检查 CSV…';
  try{
    if(!file)throw Error('请选择 CSV 文件');if(file.size>5*1024*1024)throw Error('CSV 文件不能超过 5 MB');
    const buffer=await file.arrayBuffer();let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);}catch{text=new TextDecoder('gb18030',{fatal:true}).decode(buffer);}
    const result=validateTargetCsv(text,rows,targetRecords);if(version!==targetReadVersion)return;
    pendingTargets=result;
    preview.innerHTML=`<p class="green">检查通过：${result.records.length} 条目标，覆盖 ${result.replaced} 条已有导入目标。确认后生效。</p><p class="muted">${state.page===3?'若所有记录周期一致，将自动切换至该预警周期。':'业绩总览按顶部时间范围汇总目标；请确认日期范围。'}</p><div class="scroll"><table><thead><tr><th>店铺 / SKU</th><th>周期</th><th>目标 USD</th></tr></thead><tbody>${result.records.slice(0,20).map(r=>`<tr><th>${escapeHtml(r.shop)} / ${escapeHtml(r.sku)}</th><td>${r.start} — ${r.end}</td><td>${r.target.toLocaleString()}</td></tr>`).join('')}</tbody></table></div>${result.records.length>20?'<p>预览前 20 条，确认将导入全部记录。</p>':''}`;confirm.disabled=false;
  }catch(error){if(version!==targetReadVersion)return;preview.textContent=error.message;preview.style.whiteSpace='pre-wrap';}
});
