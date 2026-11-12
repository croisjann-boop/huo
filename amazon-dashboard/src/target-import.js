import { validSkuCycle } from './sku-alerts.js';

export function parseTargetCsv(text) {
  const rows=[]; let row=[],cell='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"'){cell+='"';i++;} else if(quoted || !cell) quoted=!quoted; else throw Error('CSV 引号格式错误'); }
    else if(!quoted && (c===',' || c==='\n' || c==='\r')) {
      row.push(cell.trim());cell='';
      if(c!==','){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}
    } else cell+=c;
  }
  if(quoted)throw Error('CSV 引号未闭合');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  return rows;
}
export function validateTargetCsv(text, catalog, existing=[]) {
  const matrix=parseTargetCsv(text),header=matrix.shift()??[];
  const fields=['店铺','SKU','周期开始','周期结束','目标金额'];
  const indexes=fields.map(f=>header.indexOf(f));
  if(indexes.some(i=>i<0))throw Error('缺少列：请使用模板中的店铺、SKU、周期开始、周期结束、目标金额');
  if(!matrix.length)throw Error('CSV 没有目标数据');
  if(matrix.length>10000)throw Error('每次最多导入 10000 行');
  const records=[],errors=[];
  matrix.forEach((row,i)=>{
    const [shop,sku,start,end,amount]=indexes.map(j=>row[j]??'');
    const record={shop,sku,start,end,target:Number(amount)};
    if(row.length!==header.length)errors.push(`第 ${i+2} 行：列数不一致`);
    else if(!catalog.some(x=>x.shop===shop&&x.sku===sku))errors.push(`第 ${i+2} 行：店铺与 SKU 不匹配（${shop} / ${sku}）`);
    else if(!validSkuCycle(record))errors.push(`第 ${i+2} 行：日期须为 YYYY-MM-DD，结束日期不得早于开始日期`);
    else if(!/^\d+(\.\d{1,2})?$/.test(amount)||!Number.isFinite(record.target)||record.target<=0)errors.push(`第 ${i+2} 行：目标金额须为大于 0 的数字，最多两位小数`);
    else if(records.some(x=>x.shop===shop&&x.sku===sku&&x.start<=end&&x.end>=start))errors.push(`第 ${i+2} 行：同一 SKU 的周期重复或重叠`);
    else records.push(record);
  });
  const same=(a,b)=>a.shop===b.shop&&a.sku===b.sku&&a.start===b.start&&a.end===b.end;
  const retained=existing.filter(x=>!records.some(r=>same(x,r)));
  for(const r of records)if(retained.some(x=>x.shop===r.shop&&x.sku===r.sku&&x.start<=r.end&&x.end>=r.start))errors.push(`${r.sku}：与已导入周期重叠，请沿用原周期覆盖`);
  if(errors.length)throw Error(errors.slice(0,20).join('\n'));
  return {records,merged:[...retained,...records],replaced:existing.filter(x=>records.some(r=>same(x,r))).length};
}
export function applyTargetRecords(rows,records) {
  return rows.map(row=>{
    const r=records.find(x=>x.shop===row.shop&&x.sku===row.sku&&row.date>=x.start&&row.date<=x.end);
    if(!r)return row;
    const days=Math.round((Date.parse(r.end)-Date.parse(r.start))/86400000)+1;
    const index=Math.round((Date.parse(row.date)-Date.parse(r.start))/86400000);
    const cents=Math.round(r.target*100),base=Math.floor(cents/days),remainder=cents%days;
    return {...row,target:(base+(index<remainder?1:0))/100};
  });
}
export function targetImportControls() {
  return '<div class="target-import-actions"><button type="button" data-action="import-targets">导入目标 CSV</button><button type="button" data-action="target-template">下载目标模板</button></div>';
}
