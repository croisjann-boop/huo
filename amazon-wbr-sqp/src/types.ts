/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SKUMapRow {
  sku: string;
  parentAsin: string;
  name: string;
  productLine: string;
}

export interface ConfigParam {
  analysisType: 'Weekly' | 'Monthly';
  currentPeriod: string;
  priorPeriod: string;
  skuMap: SKUMapRow[];
}

export interface RawSellerCentralRow {
  date: string; // YYYY-MM-DD
  sku: string;
  unitsOrdered: number;
  orderedProductSales: number;
  pageViews: number;
  sessions: number;
}

export interface RawSellerboardRow {
  date: string; // YYYY-MM-DD
  sku: string;
  sales: number;
  units: number;
  ppcSpend: number;
  fees: number;
  cogs: number;
  netProfit: number;
}

export interface RawSQPRow {
  period: string; // YYYY-Wxx or YYYY-MM
  searchQuery: string;
  searchVolume: number;
  brandClicks: number;
  marketClicks: number;
  brandCtr: number; // Decimal (e.g. 0.0245 for 2.45%)
  marketCtr: number;
  brandCvr: number;
  marketCvr: number;
  purchaseShare: number; // Brand Purchases / Total Purchases (Decimal, e.g. 0.15)
}

// Normalized / Fact Data Structures
export interface FactSalesRow {
  date: string;
  sku: string;
  parentAsin: string;
  salesRevenue: number;
  unitsOrdered: number;
  ppcSpend: number;
  netProfit: number;
  periodTag: string;
}

export interface FactSQPRow extends RawSQPRow {
  ctrGap: number; // brandCtr - marketCtr
}

// Analysis Data Structures
export interface AnlySKUPerformanceRow {
  sku: string;
  parentAsin: string;
  productName: string;
  curRevenue: number;
  priRevenue: number;
  revenueChange: number;
  revenueGrowthRate: number; // decimal
  curProfit: number;
  priProfit: number;
  profitChange: number;
  profitContributionRank: number | string; // 1-based index or empty
}

export interface AnlyKeywordPerformanceRow {
  searchQuery: string;
  curSearchVolume: number;
  priSearchVolume: number;
  volumeChangeRate: number; // decimal
  curPurchaseShare: number; // decimal
  priPurchaseShare: number; // decimal
  shareChange: number; // decimal
  trafficOpportunity: string;
}
