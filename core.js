/* Pure analytics and strict CSV validation. No network requests. */
(function(root){
'use strict';
const fields=['date','marketplace','asin','sku','product','sales','orders','units','sessions','adSpend','adSales','impressions','clicks'];
const numeric=fields.slice(5);
function divide(a,b){return b>0?a/b:null;}
function aggregate(rows){const v=Object.fromEntries(numeric.map(k=>[k,0]));rows.forEach(r=>numeric.forEach(k=>v[k]+=r[k]));return {...v,acos:divide(v.adSpend,v.adSales),tacos:divide(v.adSpend,v.sales),roas:divide(v.adSales,v.adSpend),conversion:divide(v.orders,v.sessions),ctr:divide(v.clicks,v.impressions),cpc:divide(v.adSpend,v.clicks)};}
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else cell+=c;}else if(c==='"'){if(cell||closed)throw Error('CSV 引号格式有误');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v!==''))rows.push(row);row=[];}}else {if(closed)throw Error('CSV 引号后存在多余字符');cell+=c;}}
 if(quoted)throw Error('CSV 引号未闭合');row.push(cell);if(row.some(v=>v!==''))rows.push(row);return rows;
}
function importCSV(text){const matrix=parseCSV(text);if(matrix.length<2)throw Error('文件需要表头和至少一行数据');const header=matrix.shift().map(v=>v.trim());if(new Set(header).size!==header.length)throw Error('表头存在重复字段');fields.forEach(k=>{if(!header.includes(k))throw Error('缺少字段：'+k);});if(matrix.length>50000)throw Error('单次最多导入 50,000 行');const seen=new Set();return matrix.map((a,i)=>{if(a.length!==header.length)throw Error(`第 ${i+2} 行列数不一致`);const r=Object.fromEntries(header.map((k,j)=>[k,a[j].trim()]));if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date)throw Error(`第 ${i+2} 行日期无效`);if(!['US','UK','DE','JP'].includes(r.marketplace))throw Error(`第 ${i+2} 行站点须为 US/UK/DE/JP`);if(!r.asin||!r.sku||!r.product)throw Error(`第 ${i+2} 行商品信息为空`);numeric.forEach(k=>{if(r[k]===''||!Number.isFinite(Number(r[k]))||Number(r[k])<0)throw Error(`第 ${i+2} 行 ${k} 须为非负数字`);r[k]=Number(r[k]);if(!['sales','adSpend','adSales'].includes(k)&&!Number.isInteger(r[k]))throw Error(`第 ${i+2} 行 ${k} 须为整数`);});if(r.clicks>r.impressions)throw Error(`第 ${i+2} 行点击量大于曝光量`);const key=JSON.stringify([r.date,r.marketplace,r.sku]);if(seen.has(key))throw Error(`第 ${i+2} 行与之前的日期/站点/SKU 重复，请先合并汇总`);seen.add(key);return r;});}
function exportCSV(rows){const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';return '\uFEFF'+[fields,...rows.map(r=>fields.map(k=>typeof r[k]==='string'&&/^[=+\-@\t\r]/.test(r[k])?"'"+r[k]:r[k]))].map(r=>r.map(quote).join(',')).join('\r\n');}
const api={fields,aggregate,parseCSV,importCSV,exportCSV,divide};if(typeof module!=='undefined')module.exports=api;else root.Analytics=api;
})(typeof window!=='undefined'?window:globalThis);
