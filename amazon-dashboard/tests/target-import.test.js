import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTargetCsv, validateTargetCsv, applyTargetRecords } from '../src/target-import.js';
import { createMockRows,createMockTargetPlan } from '../src/mock-data.js';
import { createSkuModels } from '../src/sku-alerts.js';
const header='店铺,SKU,周期开始,周期结束,目标金额\r\n';
const line='北美旗舰店,DEMO-001,2026-11-01,2026-11-30,40000';
test('CSV 支持 BOM、引号、逗号、换行和中文，错误不产生部分导入',()=>{
  assert.deepEqual(parseTargetCsv('\uFEFFa,b\r\n"x,y","z""q"\n'),[['a','b'],['x,y','z"q']]);
  assert.throws(()=>parseTargetCsv('"unfinished'),/未闭合/);
  assert.throws(()=>validateTargetCsv(header+line+'\n'+line,createMockRows()),/重复或重叠/);
  assert.throws(()=>validateTargetCsv(header+line.replace('40000','NaN'),createMockRows()),/金额/);
  assert.throws(()=>validateTargetCsv(header+line.replace('DEMO-001','unknown'),createMockRows()),/不匹配/);
  assert.throws(()=>validateTargetCsv(header+line.replace('2026-11-30','2026-02-30'),createMockRows()),/日期/);
});
test('整周期目标精确按分分配，总览累计与 SKU 进度一致，覆盖与重叠可校验',()=>{
  const rows=createMockRows(),result=validateTargetCsv(header+line,rows);
  const plans=applyTargetRecords(createMockTargetPlan(),result.records);
  const target=plans.filter(r=>r.sku==='DEMO-001'&&r.date>='2026-11-01'&&r.date<='2026-11-30').reduce((s,r)=>s+Math.round(r.target*100),0);
  assert.equal(target,4000000);
  const patched=applyTargetRecords(rows,result.records);
  const models=createSkuModels(patched,patched,{start:'2026-11-01',end:'2026-11-30'},{},plans);
  const sku=models.find(r=>r.name==='DEMO-001');assert.equal(sku.target,40000);assert.equal(sku.light,'red');
  const actualTarget=patched.filter(r=>r.sku==='DEMO-001'&&r.date>='2026-11-01').reduce((s,r)=>s+Math.round(r.target*100),0);
  assert.equal(actualTarget,1333340);
  assert.equal(validateTargetCsv(header+line,rows,result.records).replaced,1);
  assert.throws(()=>validateTargetCsv(header+line.replace('2026-11-01','2026-11-02'),rows,result.records),/重叠/);
  assert.equal(JSON.parse(JSON.stringify(result.records))[0].target,40000);
});
