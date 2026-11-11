import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_END, createMockRows, createMockTargetPlan } from '../src/mock-data.js';
import { aggregate, filterRows, filterScopeRows, DEFAULT_FILTERS } from '../src/core.js';
import { defaultSkuCycle, skuTimeProgress, evaluateSkuWarning, validateSkuRule, normalizeSkuSettings, skuRuleKey, createSkuModels, summarizeSkuWarnings, visibleSkuModels } from '../src/sku-alerts.js';

const halfCycle={start:'2026-11-01',end:'2026-11-20'};
const rows=createMockRows();
const plan=createMockTargetPlan();

test('进度预警用完成率除以时间进度，90% 和 70% 边界分别归绿灯和黄灯',()=>{
  const assess=actual=>evaluateSkuWarning({actual,target:200,cycle:halfCycle,asOf:DATA_END});
  assert.equal(assess(90).progress,0.5);
  assert.equal(assess(90).completion,0.45);
  assert.equal(assess(90).pace,90);
  assert.equal(assess(90).light,'green');
  assert.equal(assess(89.999).light,'yellow');
  assert.equal(assess(70).light,'yellow');
  assert.equal(assess(69.999).light,'red');
  assert.equal(assess(0).light,'red');
  assert.equal(assess(-10).light,'red');
  assert.equal(assess(250).light,'green');
});

test('周期含首尾日、截至数据日并封顶 100%，兼容单日、闰月和未来周期',()=>{
  assert.deepEqual(defaultSkuCycle(),{start:'2026-11-01',end:'2026-11-30'});
  assert.equal(skuTimeProgress(defaultSkuCycle()).elapsedDays,10);
  assert.equal(skuTimeProgress(defaultSkuCycle()).progress,10/30);
  assert.equal(skuTimeProgress({start:'2024-02-01',end:'2024-02-29'},'2024-02-29').totalDays,29);
  assert.equal(skuTimeProgress(halfCycle,'2026-12-01').progress,1);
  assert.equal(skuTimeProgress({start:DATA_END,end:DATA_END}).progress,1);
  assert.equal(evaluateSkuWarning({actual:0,target:100,cycle:{start:'2026-11-11',end:'2026-11-30'}}).light,'unknown');
});

test('无效目标、缺失销售和非法周期不产生虚假的绿灯或 Infinity',()=>{
  for(const target of [0,null,NaN,Infinity,-1]) {
    const result=evaluateSkuWarning({actual:100,target,cycle:halfCycle});
    assert.equal(result.light,'unknown');
    assert.equal(result.pace,null);
  }
  assert.equal(evaluateSkuWarning({actual:100,target:100,cycle:halfCycle,dataComplete:false}).light,'unknown');
  assert.equal(evaluateSkuWarning({actual:100,target:100,cycle:{start:'2026-11-20',end:'2026-11-01'}}).light,'unknown');
  assert.equal(validateSkuRule({target:100,greenMin:70,yellowMin:90}),null);
  assert.equal(validateSkuRule({target:100,greenMin:70,yellowMin:70}),null);
  assert.equal(validateSkuRule({target:'',greenMin:90,yellowMin:70}),null);
  assert.deepEqual(validateSkuRule({target:'100.25',greenMin:'95',yellowMin:'75'}),{target:100.25,greenMin:95,yellowMin:75});
});

test('整周期目标包含未来日计划，预警与顶部回溯筛选的销售指标分别计算',()=>{
  const cycle=defaultSkuCycle();
  const sales=filterRows(rows,{...DEFAULT_FILTERS,days:'7'});
  const models=createSkuModels(filterScopeRows(rows,DEFAULT_FILTERS),sales,cycle,{},plan);
  const first=models[0];
  const monthly=rows.filter(row=>row.sku===first.name&&row.date>=cycle.start);
  const fullTarget=Number(plan.filter(row=>row.sku===first.name&&row.date>=cycle.start&&row.date<=cycle.end).reduce((sum,row)=>sum+row.target,0).toFixed(2));
  assert.equal(first.actual,aggregate(monthly).revenue);
  assert.equal(first.target,fullTarget);
  assert.equal(first.sales.revenue,aggregate(sales.filter(row=>row.sku===first.name)).revenue);
  assert.notEqual(first.actual,first.sales.revenue);
  assert.ok(Math.abs(first.pace-(first.actual/fullTarget)/(10/30)*100)<1e-10);
  for(const row of rows) assert.equal(plan.find(item=>item.sku===row.sku&&item.shop===row.shop&&item.date===row.date).target,row.target);
});

test('单 SKU 规则按店铺、SKU 和周期隔离，且修改后汇总和颜色筛选一致',()=>{
  const cycle=defaultSkuCycle();
  const base=createSkuModels(rows,rows,cycle,{},plan);
  const key=skuRuleKey(base[0].shop,base[0].name,cycle);
  const rules={[key]:{target:10000000,greenMin:95,yellowMin:75}};
  const changed=createSkuModels(rows,rows,cycle,rules,plan);
  assert.equal(changed[0].light,'red');
  assert.equal(changed[0].customRule,true);
  for(let i=1;i<changed.length;i++) assert.deepEqual(changed[i],base[i]);
  const totals=summarizeSkuWarnings(changed);
  assert.equal(totals.all,18);
  assert.equal(totals.red+totals.yellow+totals.green+totals.unknown,18);
  for(const light of ['red','yellow','green','unknown']) assert.equal(visibleSkuModels(changed,'',light).length,totals[light]);
  assert.equal(visibleSkuModels(changed,base[0].name,'red').length,1);
  assert.notEqual(skuRuleKey('另一家店',base[0].name,cycle),key);
  assert.notEqual(skuRuleKey(base[0].shop,base[0].name,halfCycle),key);
});

test('本地规则可校验恢复，损坏条目被隔离；缺一天与真实零销售可区分',()=>{
  const cycle=defaultSkuCycle();
  const key=skuRuleKey(rows[0].shop,rows[0].sku,cycle);
  const rule={target:10000,greenMin:90,yellowMin:70};
  const settings=normalizeSkuSettings({version:1,cycle,rules:{[key]:rule,broken:rule}});
  assert.deepEqual(settings.rules,{[key]:rule});
  assert.deepEqual(normalizeSkuSettings(null).cycle,cycle);
  const missing=rows.filter(row=>!(row.sku===rows[0].sku&&row.date===DATA_END));
  assert.equal(createSkuModels(missing,missing,cycle,{},plan).find(item=>item.name===rows[0].sku).light,'unknown');
  const zero=rows.map(row=>row.sku===rows[0].sku?{...row,revenue:0}:row);
  assert.equal(createSkuModels(zero,zero,cycle,{},plan)[0].light,'red');
});
