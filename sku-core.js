(function(root){
'use strict';
const day=s=>Date.parse(s+'T00:00:00Z')/86400000;
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(day(s))&&new Date(day(s)*86400000).toISOString().slice(0,10)===s;
const identity=r=>JSON.stringify([r.marketplace,r.store||'未指定店铺',r.sku]);
const key=(r,start,end)=>JSON.stringify([identity(r),start,end]);
function assess(records,goal,start,end,asof){
 if(!validDate(start)||!validDate(end)||!validDate(asof)||start>end)return {status:'missing',reason:'周期无效'};
 const total=day(end)-day(start)+1,elapsed=Math.max(0,Math.min(total,day(asof)-day(start)+1));
 const data=records.filter(r=>r.date>=start&&r.date<=end&&r.date<=asof);
 const sum=k=>data.reduce((s,r)=>s+r[k],0),sales=sum('sales'),units=sum('units'),spend=sum('adSpend'),adSales=sum('adSales');
 const base={sales,units,spend,adSales,acos:adSales>0?spend/adSales:null,tacos:sales>0?spend/sales:null,roas:spend>0?adSales/spend:null,elapsed,total,time:elapsed/total,days:new Set(data.map(r=>r.date)).size};
 if(!goal||!Number.isFinite(goal.target)||goal.target<=0)return {...base,status:'missing',reason:'未设置有效目标'};
 const actual=goal.metric==='units'?units:sales,completion=actual/goal.target,pace=elapsed?completion/(elapsed/total):null;
 const green=goal.green??.9,red=goal.red??.7;
 const status=elapsed===0?'pending':elapsed===total?(completion>=1?'green':'red'):pace>=green?'green':pace>=red?'yellow':'red';
 return {...base,actual,completion,pace,forecast:elapsed?actual/elapsed*total:null,gap:Math.max(0,goal.target-actual),status,reason:status==='pending'?'周期尚未开始':elapsed===total?(completion>=1?'周期已结束，目标达成':'周期已结束，目标未达成'):status==='green'?'目标进度符合规则':status==='yellow'?'目标进度开始落后':'目标进度明显落后'};
}
function trend(records,start,end,asof){
 const last=Math.min(day(end),day(asof)),span=Math.min(7,Math.floor((last-day(start)+1)/2));
 if(span<1)return null;
 const windows=[records.filter(r=>day(r.date)>last-span&&day(r.date)<=last),records.filter(r=>day(r.date)>last-2*span&&day(r.date)<=last-span)];
 if(windows.some(w=>new Set(w.map(r=>r.date)).size!==span))return null;
 const sums=windows.map(w=>w.reduce((s,r)=>s+r.sales,0));return sums[1]>0?sums[0]/sums[1]-1:null;
}
const api={identity,key,assess,trend,validDate};if(typeof module!=='undefined')module.exports=api;else root.SkuCore=api;
})(typeof window!=='undefined'?window:globalThis);
