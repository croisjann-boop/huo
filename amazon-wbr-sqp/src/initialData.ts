/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SKUMapRow, RawSellerCentralRow, RawSellerboardRow, RawSQPRow } from './types';

export const INITIAL_SKU_MAP: SKUMapRow[] = [
  { sku: 'ARES-PRO-BLK', parentAsin: 'B0D12345AB', name: 'Ares Pro Ergonomic Chair (Black)', productLine: 'Ergonomic Chairs' },
  { sku: 'ARES-PRO-GRY', parentAsin: 'B0D12345AB', name: 'Ares Pro Ergonomic Chair (Grey)', productLine: 'Ergonomic Chairs' },
  { sku: 'ARES-LITE-WHT', parentAsin: 'B0D12345CD', name: 'Ares Lite Mesh Office Chair (White)', productLine: 'Office Chairs' },
  { sku: 'ZEPHYR-STAND-M', parentAsin: 'B0D67890EF', name: 'Zephyr Bamboo Desk Stand (Medium)', productLine: 'Desk Accessories' },
  { sku: 'ZEPHYR-STAND-L', parentAsin: 'B0D67890EF', name: 'Zephyr Bamboo Desk Stand (Large)', productLine: 'Desk Accessories' },
];

// Helper to generate dates in 2026 W26 (June 22 - June 28) and W27 (June 29 - July 05)
export const INITIAL_SELLER_CENTRAL: RawSellerCentralRow[] = [
  // W26
  { date: '2026-06-22', sku: 'ARES-PRO-BLK', unitsOrdered: 12, orderedProductSales: 2388.00, pageViews: 240, sessions: 180 },
  { date: '2026-06-22', sku: 'ARES-PRO-GRY', unitsOrdered: 8, orderedProductSales: 1592.00, pageViews: 180, sessions: 130 },
  { date: '2026-06-22', sku: 'ARES-LITE-WHT', unitsOrdered: 15, orderedProductSales: 1785.00, pageViews: 310, sessions: 220 },
  { date: '2026-06-22', sku: 'ZEPHYR-STAND-M', unitsOrdered: 22, orderedProductSales: 990.00, pageViews: 150, sessions: 110 },
  { date: '2026-06-22', sku: 'ZEPHYR-STAND-L', unitsOrdered: 11, orderedProductSales: 605.00, pageViews: 90, sessions: 70 },

  { date: '2026-06-23', sku: 'ARES-PRO-BLK', unitsOrdered: 15, orderedProductSales: 2985.00, pageViews: 260, sessions: 200 },
  { date: '2026-06-23', sku: 'ARES-PRO-GRY', unitsOrdered: 6, orderedProductSales: 1194.00, pageViews: 170, sessions: 120 },
  { date: '2026-06-23', sku: 'ARES-LITE-WHT', unitsOrdered: 14, orderedProductSales: 1666.00, pageViews: 290, sessions: 210 },
  { date: '2026-06-23', sku: 'ZEPHYR-STAND-M', unitsOrdered: 25, orderedProductSales: 1125.00, pageViews: 160, sessions: 120 },
  { date: '2026-06-23', sku: 'ZEPHYR-STAND-L', unitsOrdered: 13, orderedProductSales: 715.00, pageViews: 100, sessions: 80 },

  { date: '2026-06-24', sku: 'ARES-PRO-BLK', unitsOrdered: 10, orderedProductSales: 1990.00, pageViews: 220, sessions: 170 },
  { date: '2026-06-24', sku: 'ARES-PRO-GRY', unitsOrdered: 9, orderedProductSales: 1791.00, pageViews: 190, sessions: 140 },
  { date: '2026-06-24', sku: 'ARES-LITE-WHT', unitsOrdered: 18, orderedProductSales: 2142.00, pageViews: 350, sessions: 260 },
  { date: '2026-06-24', sku: 'ZEPHYR-STAND-M', unitsOrdered: 20, orderedProductSales: 900.00, pageViews: 140, sessions: 100 },
  { date: '2026-06-24', sku: 'ZEPHYR-STAND-L', unitsOrdered: 10, orderedProductSales: 550.00, pageViews: 85, sessions: 65 },

  { date: '2026-06-25', sku: 'ARES-PRO-BLK', unitsOrdered: 14, orderedProductSales: 2786.00, pageViews: 250, sessions: 190 },
  { date: '2026-06-25', sku: 'ARES-PRO-GRY', unitsOrdered: 11, orderedProductSales: 2189.00, pageViews: 210, sessions: 155 },
  { date: '2026-06-25', sku: 'ARES-LITE-WHT', unitsOrdered: 16, orderedProductSales: 1904.00, pageViews: 300, sessions: 220 },
  { date: '2026-06-25', sku: 'ZEPHYR-STAND-M', unitsOrdered: 24, orderedProductSales: 1080.00, pageViews: 165, sessions: 125 },
  { date: '2026-06-25', sku: 'ZEPHYR-STAND-L', unitsOrdered: 12, orderedProductSales: 660.00, pageViews: 95, sessions: 75 },

  { date: '2026-06-26', sku: 'ARES-PRO-BLK', unitsOrdered: 16, orderedProductSales: 3184.00, pageViews: 280, sessions: 210 },
  { date: '2026-06-26', sku: 'ARES-PRO-GRY', unitsOrdered: 7, orderedProductSales: 1393.00, pageViews: 160, sessions: 115 },
  { date: '2026-06-26', sku: 'ARES-LITE-WHT', unitsOrdered: 12, orderedProductSales: 1428.00, pageViews: 280, sessions: 200 },
  { date: '2026-06-26', sku: 'ZEPHYR-STAND-M', unitsOrdered: 21, orderedProductSales: 945.00, pageViews: 145, sessions: 105 },
  { date: '2026-06-26', sku: 'ZEPHYR-STAND-L', unitsOrdered: 14, orderedProductSales: 770.00, pageViews: 105, sessions: 80 },

  { date: '2026-06-27', sku: 'ARES-PRO-BLK', unitsOrdered: 18, orderedProductSales: 3582.00, pageViews: 310, sessions: 240 },
  { date: '2026-06-27', sku: 'ARES-PRO-GRY', unitsOrdered: 12, orderedProductSales: 2388.00, pageViews: 230, sessions: 175 },
  { date: '2026-06-27', sku: 'ARES-LITE-WHT', unitsOrdered: 22, orderedProductSales: 2618.00, pageViews: 380, sessions: 290 },
  { date: '2026-06-27', sku: 'ZEPHYR-STAND-M', unitsOrdered: 28, orderedProductSales: 1260.00, pageViews: 180, sessions: 140 },
  { date: '2026-06-27', sku: 'ZEPHYR-STAND-L', unitsOrdered: 16, orderedProductSales: 880.00, pageViews: 120, sessions: 90 },

  { date: '2026-06-28', sku: 'ARES-PRO-BLK', unitsOrdered: 20, orderedProductSales: 3980.00, pageViews: 330, sessions: 260 },
  { date: '2026-06-28', sku: 'ARES-PRO-GRY', unitsOrdered: 10, orderedProductSales: 1990.00, pageViews: 200, sessions: 150 },
  { date: '2026-06-28', sku: 'ARES-LITE-WHT', unitsOrdered: 20, orderedProductSales: 2380.00, pageViews: 360, sessions: 270 },
  { date: '2026-06-28', sku: 'ZEPHYR-STAND-M', unitsOrdered: 30, orderedProductSales: 1350.00, pageViews: 190, sessions: 145 },
  { date: '2026-06-28', sku: 'ZEPHYR-STAND-L', unitsOrdered: 15, orderedProductSales: 825.00, pageViews: 110, sessions: 85 },

  // W27
  { date: '2026-06-29', sku: 'ARES-PRO-BLK', unitsOrdered: 22, orderedProductSales: 4378.00, pageViews: 350, sessions: 280 },
  { date: '2026-06-29', sku: 'ARES-PRO-GRY', unitsOrdered: 5, orderedProductSales: 995.00, pageViews: 150, sessions: 110 }, // Big drop!
  { date: '2026-06-29', sku: 'ARES-LITE-WHT', unitsOrdered: 19, orderedProductSales: 2261.00, pageViews: 320, sessions: 240 },
  { date: '2026-06-29', sku: 'ZEPHYR-STAND-M', unitsOrdered: 24, orderedProductSales: 1080.00, pageViews: 160, sessions: 120 },
  { date: '2026-06-29', sku: 'ZEPHYR-STAND-L', unitsOrdered: 12, orderedProductSales: 660.00, pageViews: 90, sessions: 70 },

  { date: '2026-06-30', sku: 'ARES-PRO-BLK', unitsOrdered: 25, orderedProductSales: 4975.00, pageViews: 380, sessions: 290 },
  { date: '2026-06-30', sku: 'ARES-PRO-GRY', unitsOrdered: 4, orderedProductSales: 796.00, pageViews: 140, sessions: 100 },  // Big drop!
  { date: '2026-06-30', sku: 'ARES-LITE-WHT', unitsOrdered: 18, orderedProductSales: 2142.00, pageViews: 300, sessions: 225 },
  { date: '2026-06-30', sku: 'ZEPHYR-STAND-M', unitsOrdered: 26, orderedProductSales: 1170.00, pageViews: 170, sessions: 130 },
  { date: '2026-06-30', sku: 'ZEPHYR-STAND-L', unitsOrdered: 14, orderedProductSales: 770.00, pageViews: 100, sessions: 80 },

  { date: '2026-07-01', sku: 'ARES-PRO-BLK', unitsOrdered: 28, orderedProductSales: 5572.00, pageViews: 410, sessions: 320 },
  { date: '2026-07-01', sku: 'ARES-PRO-GRY', unitsOrdered: 3, orderedProductSales: 597.00, pageViews: 120, sessions: 90 },   // Big drop!
  { date: '2026-07-01', sku: 'ARES-LITE-WHT', unitsOrdered: 22, orderedProductSales: 2618.00, pageViews: 360, sessions: 270 },
  { date: '2026-07-01', sku: 'ZEPHYR-STAND-M', unitsOrdered: 28, orderedProductSales: 1260.00, pageViews: 180, sessions: 135 },
  { date: '2026-07-01', sku: 'ZEPHYR-STAND-L', unitsOrdered: 10, orderedProductSales: 550.00, pageViews: 85, sessions: 65 },

  { date: '2026-07-02', sku: 'ARES-PRO-BLK', unitsOrdered: 24, orderedProductSales: 4776.00, pageViews: 370, sessions: 285 },
  { date: '2026-07-02', sku: 'ARES-PRO-GRY', unitsOrdered: 3, orderedProductSales: 597.00, pageViews: 115, sessions: 85 },   // Big drop!
  { date: '2026-07-02', sku: 'ARES-LITE-WHT', unitsOrdered: 24, orderedProductSales: 2856.00, pageViews: 390, sessions: 300 },
  { date: '2026-07-02', sku: 'ZEPHYR-STAND-M', unitsOrdered: 22, orderedProductSales: 990.00, pageViews: 155, sessions: 115 },
  { date: '2026-07-02', sku: 'ZEPHYR-STAND-L', unitsOrdered: 11, orderedProductSales: 605.00, pageViews: 90, sessions: 70 },

  { date: '2026-07-03', sku: 'ARES-PRO-BLK', unitsOrdered: 26, orderedProductSales: 5174.00, pageViews: 390, sessions: 305 },
  { date: '2026-07-03', sku: 'ARES-PRO-GRY', unitsOrdered: 2, orderedProductSales: 398.00, pageViews: 100, sessions: 70 },   // Big drop!
  { date: '2026-07-03', sku: 'ARES-LITE-WHT', unitsOrdered: 25, orderedProductSales: 2975.00, pageViews: 400, sessions: 310 },
  { date: '2026-07-03', sku: 'ZEPHYR-STAND-M', unitsOrdered: 20, orderedProductSales: 900.00, pageViews: 145, sessions: 110 },
  { date: '2026-07-03', sku: 'ZEPHYR-STAND-L', unitsOrdered: 13, orderedProductSales: 715.00, pageViews: 100, sessions: 75 },

  { date: '2026-07-04', sku: 'ARES-PRO-BLK', unitsOrdered: 32, orderedProductSales: 6368.00, pageViews: 440, sessions: 350 },
  { date: '2026-07-04', sku: 'ARES-PRO-GRY', unitsOrdered: 4, orderedProductSales: 796.00, pageViews: 130, sessions: 95 },
  { date: '2026-07-04', sku: 'ARES-LITE-WHT', unitsOrdered: 30, orderedProductSales: 3570.00, pageViews: 460, sessions: 360 },
  { date: '2026-07-04', sku: 'ZEPHYR-STAND-M', unitsOrdered: 32, orderedProductSales: 1440.00, pageViews: 200, sessions: 150 },
  { date: '2026-07-04', sku: 'ZEPHYR-STAND-L', unitsOrdered: 16, orderedProductSales: 880.00, pageViews: 120, sessions: 90 },

  { date: '2026-07-05', sku: 'ARES-PRO-BLK', unitsOrdered: 30, orderedProductSales: 5970.00, pageViews: 420, sessions: 330 },
  { date: '2026-07-05', sku: 'ARES-PRO-GRY', unitsOrdered: 3, orderedProductSales: 597.00, pageViews: 110, sessions: 80 },
  { date: '2026-07-05', sku: 'ARES-LITE-WHT', unitsOrdered: 28, orderedProductSales: 3332.00, pageViews: 440, sessions: 340 },
  { date: '2026-07-05', sku: 'ZEPHYR-STAND-M', unitsOrdered: 35, orderedProductSales: 1575.00, pageViews: 220, sessions: 165 },
  { date: '2026-07-05', sku: 'ZEPHYR-STAND-L', unitsOrdered: 18, orderedProductSales: 990.00, pageViews: 130, sessions: 100 },
];

export const INITIAL_SELLERBOARD: RawSellerboardRow[] = [
  // W26
  { date: '2026-06-22', sku: 'ARES-PRO-BLK', sales: 2388.00, units: 12, ppcSpend: 420.00, fees: 835.80, cogs: 600.00, netProfit: 532.20 },
  { date: '2026-06-22', sku: 'ARES-PRO-GRY', sales: 1592.00, units: 8, ppcSpend: 310.00, fees: 557.20, cogs: 400.00, netProfit: 324.80 },
  { date: '2026-06-22', sku: 'ARES-LITE-WHT', sales: 1785.00, units: 15, ppcSpend: 250.00, fees: 624.75, cogs: 450.00, netProfit: 460.25 },
  { date: '2026-06-22', sku: 'ZEPHYR-STAND-M', sales: 990.00, units: 22, ppcSpend: 110.00, fees: 346.50, cogs: 220.00, netProfit: 313.50 },
  { date: '2026-06-22', sku: 'ZEPHYR-STAND-L', sales: 605.00, units: 11, ppcSpend: 80.00, fees: 211.75, cogs: 132.00, netProfit: 181.25 },

  { date: '2026-06-23', sku: 'ARES-PRO-BLK', sales: 2985.00, units: 15, ppcSpend: 450.00, fees: 1044.75, cogs: 750.00, netProfit: 740.25 },
  { date: '2026-06-23', sku: 'ARES-PRO-GRY', sales: 1194.00, units: 6, ppcSpend: 290.00, fees: 417.90, cogs: 300.00, netProfit: 186.10 },
  { date: '2026-06-23', sku: 'ARES-LITE-WHT', sales: 1666.00, units: 14, ppcSpend: 240.00, fees: 583.10, cogs: 420.00, netProfit: 422.90 },
  { date: '2026-06-23', sku: 'ZEPHYR-STAND-M', sales: 1125.00, units: 25, ppcSpend: 120.00, fees: 393.75, cogs: 250.00, netProfit: 361.25 },
  { date: '2026-06-23', sku: 'ZEPHYR-STAND-L', sales: 715.00, units: 13, ppcSpend: 90.00, fees: 250.25, cogs: 156.00, netProfit: 218.75 },

  { date: '2026-06-24', sku: 'ARES-PRO-BLK', sales: 1990.00, units: 10, ppcSpend: 400.00, fees: 696.50, cogs: 500.00, netProfit: 393.50 },
  { date: '2026-06-24', sku: 'ARES-PRO-GRY', sales: 1791.00, units: 9, ppcSpend: 330.00, fees: 626.85, cogs: 450.00, netProfit: 384.15 },
  { date: '2026-06-24', sku: 'ARES-LITE-WHT', sales: 2142.00, units: 18, ppcSpend: 280.00, fees: 749.70, cogs: 540.00, netProfit: 572.30 },
  { date: '2026-06-24', sku: 'ZEPHYR-STAND-M', sales: 900.00, units: 20, ppcSpend: 110.00, fees: 315.00, cogs: 200.00, netProfit: 275.00 },
  { date: '2026-06-24', sku: 'ZEPHYR-STAND-L', sales: 550.00, units: 10, ppcSpend: 80.00, fees: 192.50, cogs: 120.00, netProfit: 157.50 },

  { date: '2026-06-25', sku: 'ARES-PRO-BLK', sales: 2786.00, units: 14, ppcSpend: 440.00, fees: 975.10, cogs: 700.00, netProfit: 670.90 },
  { date: '2026-06-25', sku: 'ARES-PRO-GRY', sales: 2189.00, units: 11, ppcSpend: 350.00, fees: 766.15, cogs: 550.00, netProfit: 522.85 },
  { date: '2026-06-25', sku: 'ARES-LITE-WHT', sales: 1904.00, units: 16, ppcSpend: 260.00, fees: 666.40, cogs: 480.00, netProfit: 497.60 },
  { date: '2026-06-25', sku: 'ZEPHYR-STAND-M', sales: 1080.00, units: 24, ppcSpend: 130.00, fees: 378.00, cogs: 240.00, netProfit: 332.00 },
  { date: '2026-06-25', sku: 'ZEPHYR-STAND-L', sales: 660.00, units: 12, ppcSpend: 85.00, fees: 231.00, cogs: 144.00, netProfit: 200.00 },

  { date: '2026-06-26', sku: 'ARES-PRO-BLK', sales: 3184.00, units: 16, ppcSpend: 460.00, fees: 1114.40, cogs: 800.00, netProfit: 809.60 },
  { date: '2026-06-26', sku: 'ARES-PRO-GRY', sales: 1393.00, units: 7, ppcSpend: 300.00, fees: 487.55, cogs: 350.00, netProfit: 255.45 },
  { date: '2026-06-26', sku: 'ARES-LITE-WHT', sales: 1428.00, units: 12, ppcSpend: 220.00, fees: 499.80, cogs: 360.00, netProfit: 348.20 },
  { date: '2026-06-26', sku: 'ZEPHYR-STAND-M', sales: 945.00, units: 21, ppcSpend: 115.00, fees: 330.75, cogs: 210.00, netProfit: 289.25 },
  { date: '2026-06-26', sku: 'ZEPHYR-STAND-L', sales: 770.00, units: 14, ppcSpend: 95.00, fees: 269.50, cogs: 168.00, netProfit: 237.50 },

  { date: '2026-06-27', sku: 'ARES-PRO-BLK', sales: 3582.00, units: 18, ppcSpend: 480.00, fees: 1253.70, cogs: 900.00, netProfit: 948.30 },
  { date: '2026-06-27', sku: 'ARES-PRO-GRY', sales: 2388.00, units: 12, ppcSpend: 380.00, fees: 835.80, cogs: 600.00, netProfit: 572.20 },
  { date: '2026-06-27', sku: 'ARES-LITE-WHT', sales: 2618.00, units: 22, ppcSpend: 320.00, fees: 916.30, cogs: 660.00, netProfit: 721.70 },
  { date: '2026-06-27', sku: 'ZEPHYR-STAND-M', sales: 1260.00, units: 28, ppcSpend: 150.00, fees: 441.00, cogs: 280.00, netProfit: 389.00 },
  { date: '2026-06-27', sku: 'ZEPHYR-STAND-L', sales: 880.00, units: 16, ppcSpend: 110.00, fees: 308.00, cogs: 192.00, netProfit: 270.00 },

  { date: '2026-06-28', sku: 'ARES-PRO-BLK', sales: 3980.00, units: 20, ppcSpend: 500.00, fees: 1393.00, cogs: 1000.00, netProfit: 1087.00 },
  { date: '2026-06-28', sku: 'ARES-PRO-GRY', sales: 1990.00, units: 10, ppcSpend: 350.00, fees: 696.50, cogs: 500.00, netProfit: 443.50 },
  { date: '2026-06-28', sku: 'ARES-LITE-WHT', sales: 2380.00, units: 20, ppcSpend: 300.00, fees: 833.00, cogs: 600.00, netProfit: 647.00 },
  { date: '2026-06-28', sku: 'ZEPHYR-STAND-M', sales: 1350.00, units: 30, ppcSpend: 160.00, fees: 472.50, cogs: 300.00, netProfit: 417.50 },
  { date: '2026-06-28', sku: 'ZEPHYR-STAND-L', sales: 825.00, units: 15, ppcSpend: 100.00, fees: 288.75, cogs: 180.00, netProfit: 256.25 },

  // W27
  { date: '2026-06-29', sku: 'ARES-PRO-BLK', sales: 4378.00, units: 22, ppcSpend: 510.00, fees: 1532.30, cogs: 1100.00, netProfit: 1235.70 },
  { date: '2026-06-29', sku: 'ARES-PRO-GRY', sales: 995.00, units: 5, ppcSpend: 380.00, fees: 348.25, cogs: 250.00, netProfit: 16.75 },     // Tiny Profit! (PPC was high)
  { date: '2026-06-29', sku: 'ARES-LITE-WHT', sales: 2261.00, units: 19, ppcSpend: 290.00, fees: 791.35, cogs: 570.00, netProfit: 609.65 },
  { date: '2026-06-29', sku: 'ZEPHYR-STAND-M', sales: 1080.00, units: 24, ppcSpend: 120.00, fees: 378.00, cogs: 240.00, netProfit: 342.00 },
  { date: '2026-06-29', sku: 'ZEPHYR-STAND-L', sales: 660.00, units: 12, ppcSpend: 85.00, fees: 231.00, cogs: 144.00, netProfit: 200.00 },

  { date: '2026-06-30', sku: 'ARES-PRO-BLK', sales: 4975.00, units: 25, ppcSpend: 530.00, fees: 1741.25, cogs: 1250.00, netProfit: 1453.75 },
  { date: '2026-06-30', sku: 'ARES-PRO-GRY', sales: 796.00, units: 4, ppcSpend: 390.00, fees: 278.60, cogs: 200.00, netProfit: -72.60 },     // Loss!
  { date: '2026-06-30', sku: 'ARES-LITE-WHT', sales: 2142.00, units: 18, ppcSpend: 280.00, fees: 749.70, cogs: 540.00, netProfit: 572.30 },
  { date: '2026-06-30', sku: 'ZEPHYR-STAND-M', sales: 1170.00, units: 26, ppcSpend: 130.00, fees: 409.50, cogs: 260.00, netProfit: 370.50 },
  { date: '2026-06-30', sku: 'ZEPHYR-STAND-L', sales: 770.00, units: 14, ppcSpend: 95.00, fees: 269.50, cogs: 168.00, netProfit: 237.50 },

  { date: '2026-07-01', sku: 'ARES-PRO-BLK', sales: 5572.00, units: 28, ppcSpend: 550.00, fees: 1950.20, cogs: 1400.00, netProfit: 1671.80 },
  { date: '2026-07-01', sku: 'ARES-PRO-GRY', sales: 597.00, units: 3, ppcSpend: 400.00, fees: 208.95, cogs: 150.00, netProfit: -161.95 },    // Big Loss!
  { date: '2026-07-01', sku: 'ARES-LITE-WHT', sales: 2618.00, units: 22, ppcSpend: 320.00, fees: 916.30, cogs: 660.00, netProfit: 721.70 },
  { date: '2026-07-01', sku: 'ZEPHYR-STAND-M', sales: 1260.00, units: 28, ppcSpend: 140.00, fees: 441.00, cogs: 280.00, netProfit: 399.00 },
  { date: '2026-07-01', sku: 'ZEPHYR-STAND-L', sales: 550.00, units: 10, ppcSpend: 80.00, fees: 192.50, cogs: 120.00, netProfit: 157.50 },

  { date: '2026-07-02', sku: 'ARES-PRO-BLK', sales: 4776.00, units: 24, ppcSpend: 520.00, fees: 1671.60, cogs: 1200.00, netProfit: 1384.40 },
  { date: '2026-07-02', sku: 'ARES-PRO-GRY', sales: 597.00, units: 3, ppcSpend: 390.00, fees: 208.95, cogs: 150.00, netProfit: -151.95 },    // Loss!
  { date: '2026-07-02', sku: 'ARES-LITE-WHT', sales: 2856.00, units: 24, ppcSpend: 350.00, fees: 999.60, cogs: 720.00, netProfit: 786.40 },
  { date: '2026-07-02', sku: 'ZEPHYR-STAND-M', sales: 990.00, units: 22, ppcSpend: 110.00, fees: 346.50, cogs: 220.00, netProfit: 313.50 },
  { date: '2026-07-02', sku: 'ZEPHYR-STAND-L', sales: 605.00, units: 11, ppcSpend: 80.00, fees: 211.75, cogs: 132.00, netProfit: 181.25 },

  { date: '2026-07-03', sku: 'ARES-PRO-BLK', sales: 5174.00, units: 26, ppcSpend: 540.00, fees: 1810.90, cogs: 1300.00, netProfit: 1523.10 },
  { date: '2026-07-03', sku: 'ARES-PRO-GRY', sales: 398.00, units: 2, ppcSpend: 350.00, fees: 139.30, cogs: 100.00, netProfit: -191.30 },    // Heavy Loss!
  { date: '2026-07-03', sku: 'ARES-LITE-WHT', sales: 2975.00, units: 25, ppcSpend: 360.00, fees: 1041.25, cogs: 750.00, netProfit: 823.75 },
  { date: '2026-07-03', sku: 'ZEPHYR-STAND-M', sales: 900.00, units: 20, ppcSpend: 110.00, fees: 315.00, cogs: 200.00, netProfit: 275.00 },
  { date: '2026-07-03', sku: 'ZEPHYR-STAND-L', sales: 715.00, units: 13, ppcSpend: 90.00, fees: 250.25, cogs: 156.00, netProfit: 218.75 },

  { date: '2026-07-04', sku: 'ARES-PRO-BLK', sales: 6368.00, units: 32, ppcSpend: 580.00, fees: 2228.80, cogs: 1600.00, netProfit: 1959.20 },
  { date: '2026-07-04', sku: 'ARES-PRO-GRY', sales: 796.00, units: 4, ppcSpend: 360.00, fees: 278.60, cogs: 200.00, netProfit: -42.60 },
  { date: '2026-07-04', sku: 'ARES-LITE-WHT', sales: 3570.00, units: 30, ppcSpend: 400.00, fees: 1249.50, cogs: 900.00, netProfit: 1020.50 },
  { date: '2026-07-04', sku: 'ZEPHYR-STAND-M', sales: 1440.00, units: 32, ppcSpend: 160.00, fees: 504.00, cogs: 320.00, netProfit: 456.00 },
  { date: '2026-07-04', sku: 'ZEPHYR-STAND-L', sales: 880.00, units: 16, ppcSpend: 110.00, fees: 308.00, cogs: 192.00, netProfit: 270.00 },

  { date: '2026-07-05', sku: 'ARES-PRO-BLK', sales: 5970.00, units: 30, ppcSpend: 560.00, fees: 2089.50, cogs: 1500.00, netProfit: 1820.50 },
  { date: '2026-07-05', sku: 'ARES-PRO-GRY', sales: 597.00, units: 3, ppcSpend: 340.00, fees: 208.95, cogs: 150.00, netProfit: -101.95 },
  { date: '2026-07-05', sku: 'ARES-LITE-WHT', sales: 3332.00, units: 28, ppcSpend: 380.00, fees: 1166.20, cogs: 840.00, netProfit: 945.80 },
  { date: '2026-07-05', sku: 'ZEPHYR-STAND-M', sales: 1575.00, units: 35, ppcSpend: 180.00, fees: 551.25, cogs: 350.00, netProfit: 493.75 },
  { date: '2026-07-05', sku: 'ZEPHYR-STAND-L', sales: 990.00, units: 18, ppcSpend: 120.00, fees: 346.50, cogs: 216.00, netProfit: 307.50 },
];

export const INITIAL_SQP: RawSQPRow[] = [
  // W26 Keywords
  { period: '2026-W26', searchQuery: 'ergonomic office chair', searchVolume: 43000, brandClicks: 2150, marketClicks: 86000, brandCtr: 0.050, marketCtr: 0.038, brandCvr: 0.042, marketCvr: 0.035, purchaseShare: 0.125 },
  { period: '2026-W26', searchQuery: 'office chair high back', searchVolume: 28000, brandClicks: 1120, marketClicks: 56000, brandCtr: 0.040, marketCtr: 0.042, brandCvr: 0.038, marketCvr: 0.038, purchaseShare: 0.080 },
  { period: '2026-W26', searchQuery: 'lumbar support chair', searchVolume: 30000, brandClicks: 1500, marketClicks: 60000, brandCtr: 0.050, marketCtr: 0.045, brandCvr: 0.045, marketCvr: 0.040, purchaseShare: 0.110 },
  { period: '2026-W26', searchQuery: 'mesh desk chair', searchVolume: 35000, brandClicks: 1750, marketClicks: 70000, brandCtr: 0.050, marketCtr: 0.048, brandCvr: 0.040, marketCvr: 0.038, purchaseShare: 0.095 },
  { period: '2026-W26', searchQuery: 'bamboo monitor stand', searchVolume: 16000, brandClicks: 1280, marketClicks: 32000, brandCtr: 0.080, marketCtr: 0.055, brandCvr: 0.065, marketCvr: 0.050, purchaseShare: 0.180 },
  { period: '2026-W26', searchQuery: 'desk monitor riser', searchVolume: 12000, brandClicks: 720, marketClicks: 24000, brandCtr: 0.060, marketCtr: 0.052, brandCvr: 0.055, marketCvr: 0.048, purchaseShare: 0.130 },
  { period: '2026-W26', searchQuery: 'bamboo desk shelf', searchVolume: 9000, brandClicks: 540, marketClicks: 18000, brandCtr: 0.060, marketCtr: 0.050, brandCvr: 0.050, marketCvr: 0.045, purchaseShare: 0.100 },
  { period: '2026-W26', searchQuery: 'ergonomic gaming seat', searchVolume: 18000, brandClicks: 360, marketClicks: 36000, brandCtr: 0.020, marketCtr: 0.035, brandCvr: 0.022, marketCvr: 0.032, purchaseShare: 0.020 },
  { period: '2026-W26', searchQuery: 'adjustable swivel seat', searchVolume: 14000, brandClicks: 420, marketClicks: 28000, brandCtr: 0.030, marketCtr: 0.040, brandCvr: 0.028, marketCvr: 0.036, purchaseShare: 0.030 },
  { period: '2026-W26', searchQuery: 'wooden laptop base', searchVolume: 7500, brandClicks: 450, marketClicks: 15000, brandCtr: 0.060, marketCtr: 0.048, brandCvr: 0.050, marketCvr: 0.045, purchaseShare: 0.090 },

  // W27 Keywords
  { period: '2026-W27', searchQuery: 'ergonomic office chair', searchVolume: 45000, brandClicks: 2475, marketClicks: 90000, brandCtr: 0.055, marketCtr: 0.040, brandCvr: 0.045, marketCvr: 0.036, purchaseShare: 0.140 }, // Solid performance
  { period: '2026-W27', searchQuery: 'office chair high back', searchVolume: 29000, brandClicks: 580, marketClicks: 58000, brandCtr: 0.020, marketCtr: 0.044, brandCvr: 0.040, marketCvr: 0.039, purchaseShare: 0.040 },  // Brand CTR drop! (Lost buy box or image issue)
  { period: '2026-W27', searchQuery: 'lumbar support chair', searchVolume: 31000, brandClicks: 1612, marketClicks: 62000, brandCtr: 0.052, marketCtr: 0.046, brandCvr: 0.048, marketCvr: 0.041, purchaseShare: 0.115 },
  { period: '2026-W27', searchQuery: 'mesh desk chair', searchVolume: 36000, brandClicks: 1800, marketClicks: 72000, brandCtr: 0.050, marketCtr: 0.049, brandCvr: 0.025, marketCvr: 0.038, purchaseShare: 0.055 },  // Brand CVR drop! (Listing or review issues)
  { period: '2026-W27', searchQuery: 'bamboo monitor stand', searchVolume: 15000, brandClicks: 1200, marketClicks: 30000, brandCtr: 0.080, marketCtr: 0.056, brandCvr: 0.068, marketCvr: 0.052, purchaseShare: 0.190 },
  { period: '2026-W27', searchQuery: 'desk monitor riser', searchVolume: 13000, brandClicks: 715, marketClicks: 26000, brandCtr: 0.055, marketCtr: 0.053, brandCvr: 0.052, marketCvr: 0.049, purchaseShare: 0.115 },
  { period: '2026-W27', searchQuery: 'bamboo desk shelf', searchVolume: 9500, brandClicks: 522, marketClicks: 19000, brandCtr: 0.055, marketCtr: 0.051, brandCvr: 0.048, marketCvr: 0.046, purchaseShare: 0.090 },
  { period: '2026-W27', searchQuery: 'ergonomic gaming seat', searchVolume: 19000, brandClicks: 285, marketClicks: 38000, brandCtr: 0.015, marketCtr: 0.036, brandCvr: 0.018, marketCvr: 0.033, purchaseShare: 0.012 },  // Double drop!
  { period: '2026-W27', searchQuery: 'adjustable swivel seat', searchVolume: 13500, brandClicks: 337, marketClicks: 27000, brandCtr: 0.025, marketCtr: 0.039, brandCvr: 0.022, marketCvr: 0.035, purchaseShare: 0.022 },
  { period: '2026-W27', searchQuery: 'wooden laptop base', searchVolume: 8000, brandClicks: 520, marketClicks: 16000, brandCtr: 0.065, marketCtr: 0.050, brandCvr: 0.055, marketCvr: 0.047, purchaseShare: 0.105 },
];
