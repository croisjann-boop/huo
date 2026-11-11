import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { KNOWLEDGE_DATA } from '../src/knowledge-data.js';
import { DEFAULT_KNOWLEDGE_FILTERS, KNOWLEDGE_STRATEGIES, KNOWLEDGE_DEFINITIONS, KNOWLEDGE_AUDIENCES, KNOWLEDGE_COLUMNS, filterKnowledgeStrategies, knowledgePagination, renderKnowledgePage, renderKnowledgeResults } from '../src/knowledge.js';
import { escapeHtml } from '../src/core.js';
import { PAGES, renderPage } from '../src/views.js';

test('导入来源与原始 XLSX 哈希一致，123 条策略和 10 张 AMC 流程配图完整', () => {
  const source = fs.readFileSync(new URL('../reference/※群爆款更新excel版202610104.xlsx', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), KNOWLEDGE_DATA.source.sha256);
  assert.equal(KNOWLEDGE_DATA.sheets.length, 4);
  assert.equal(KNOWLEDGE_STRATEGIES.length, 123);
  assert.deepEqual(KNOWLEDGE_STRATEGIES.map(row => row.row), Array.from({length:123}, (_, index) => index + 2));
  assert.equal(KNOWLEDGE_STRATEGIES[0].J, 'A4-SD-PV-CTX-TPPAsin');
  assert.equal(KNOWLEDGE_STRATEGIES.at(-1).J, 'A2-SB-VID-PT-场景关联类目');
  assert.equal(KNOWLEDGE_DEFINITIONS.length, 5);
  assert.equal(KNOWLEDGE_AUDIENCES.length, 10);
  for (const row of KNOWLEDGE_AUDIENCES) {
    assert.match(KNOWLEDGE_DATA.images[row.imageId], /^data:image\/png;base64,/);
    assert.equal(Buffer.from(KNOWLEDGE_DATA.images[row.imageId].split(',')[1], 'base64').subarray(0,8).toString('hex'), '89504e470d0a1a0a');
  }
});

test('知识筛选组合流量、类型、定向、建组建议、优先级和多关键词', () => {
  const filtered = filterKnowledgeStrategies({ stage:'A3', type:'SP', recommendation:'required' });
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every(row => row.B === 'A3' && row.C === 'SP' && row.M.startsWith('必建')));
  const exact = filterKnowledgeStrategies({ query:'A4-SD-PV-CTX-TPPAsin', stage:'A4', type:'SD', targeting:'CTX' });
  assert.equal(exact.length, 1);
  assert.equal(exact[0].row, 2);
  assert.ok(filterKnowledgeStrategies({ query:'amc' }).length > 0);
  assert.ok(filterKnowledgeStrategies({priority:'P1'}).every(row => row.N === 'P1'));
  assert.ok(filterKnowledgeStrategies({priority:'unmarked'}).every(row => !row.N));
  assert.equal(filterKnowledgeStrategies({query:'__no_matching_knowledge__'}).length, 0);
});

test('分页可访问全部策略和全部 15 个字段，最后一页不会丢失记录', () => {
  const visited = [];
  const pages = knowledgePagination(DEFAULT_KNOWLEDGE_FILTERS).pageCount;
  for (let page = 1; page <= pages; page += 1) {
    const filters = {...DEFAULT_KNOWLEDGE_FILTERS, page};
    const {rows} = knowledgePagination(filters);
    const html = renderKnowledgeResults(filters);
    visited.push(...rows.map(row => row.row));
    for (const row of rows) for (const [column] of KNOWLEDGE_COLUMNS) if (row[column]) assert.ok(html.includes(escapeHtml(row[column])), `${row.row}:${column}`);
  }
  assert.equal(new Set(visited).size, 123);
  assert.equal(knowledgePagination({...DEFAULT_KNOWLEDGE_FILTERS,page:999}).page, pages);
});

test('8 个页面保留，广告知识不受销售空数据影响，所有知识分区可展示', () => {
  assert.equal(PAGES.length, 8);
  assert.equal(PAGES[7], '广告知识');
  assert.match(renderPage([], {page:7}, {}), /广告运营知识库/);
  for (const tab of ['strategies','definitions','why','amc','guide']) {
    const html = renderKnowledgePage({knowledgeTab:tab});
    assert.doesNotMatch(html, /undefined|NaN|href="data:/);
    assert.match(html, /knowledge-image-dialog/);
  }
  const audience = renderKnowledgePage({knowledgeTab:'amc'});
  assert.ok(audience.includes('购买过-波特兰餐桌椅-30D'));
  assert.ok(audience.includes(KNOWLEDGE_DATA.namingImage));
});
