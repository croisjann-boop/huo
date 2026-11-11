// 固定演示截止日，确保所有人打开项目时得到相同数据。
export const DATA_END = '2026-11-10';
export const STORES = [
  { country: '美国', name: '北美旗舰店' },
  { country: '德国', name: '欧洲生活馆' },
  { country: '英国', name: '英国家居店' },
];
const products = ['庭院遮阳伞', '金属储物棚', '户外棚架', '休闲藤椅', '餐桌组合', '折叠边桌'];
export function dateBefore(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export function createMockRows() {
  const rows = [];
  for (let offset = 0; offset < 30; offset += 1) {
    for (let i = 0; i < 18; i += 1) {
      const productIndex = i % 6;
      const units = 12 + ((i * 17 + offset * 13) % 39);
      const revenue = units * (32 + productIndex * 18);
      const adSpend = revenue * (0.08 + (i % 5) * 0.035);
      const clicks = Math.round(adSpend / (0.7 + (i % 4) * 0.4));
      rows.push({
        date: dateBefore(DATA_END, offset),
        country: STORES[i % 3].country,
        shop: STORES[i % 3].name,
        category1: productIndex < 3 ? '户外花园' : '家居家具',
        category2: productIndex < 3 ? '庭院设施' : '休闲家具',
        category3: products[productIndex],
        sku: `DEMO-${String(i + 1).padStart(3, '0')}`,
        asin: `B0DEMO${String(i + 1).padStart(4, '0')}`,
        revenue, units, adSpend, clicks,
        impressions: clicks * (100 + i * 20),
        adRevenue: revenue * (0.3 + (i % 4) * 0.08),
        adOrders: Math.round(clicks * 0.08),
        desktopVisits: units * 4,
        mobileVisits: units * 9,
        refunds: Math.round(units * (i % 4) * 0.024),
        target: revenue * (0.85 + (i % 5) * 0.12),
      });
    }
  }
  return rows;
}
