/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { FactSalesRow, SKUMapRow, AnlySKUPerformanceRow } from '../types';
import { formatCurrency, formatPercentOneDecimal } from '../utils';
import { TrendingDown, Sparkles, AlertCircle } from 'lucide-react';

interface AnlySKUPerformanceTableProps {
  factSales: FactSalesRow[];
  skuMap: SKUMapRow[];
  currentPeriod: string;
  priorPeriod: string;
}

export default function AnlySKUPerformanceTable({
  factSales,
  skuMap,
  currentPeriod,
  priorPeriod
}: AnlySKUPerformanceTableProps) {

  // Compute SKU Performance diagnosed records on the fly
  const diagnosedRows = useMemo(() => {
    // 1. Extract SKUs present in current period
    const currentPeriodSKUs = Array.from(new Set(
      factSales
        .filter(r => r.periodTag === currentPeriod)
        .map(r => r.sku)
    ));

    // Calculate metrics
    let rows: AnlySKUPerformanceRow[] = currentPeriodSKUs.map(sku => {
      const mapInfo = skuMap.find(m => m.sku === sku);
      const parentAsin = mapInfo?.parentAsin || 'Unmapped';
      const productName = mapInfo?.name || 'Unmapped SKU';

      // Current values
      const curSalesRows = factSales.filter(r => r.sku === sku && r.periodTag === currentPeriod);
      const curRevenue = curSalesRows.reduce((sum, r) => sum + r.salesRevenue, 0);
      const curProfit = curSalesRows.reduce((sum, r) => sum + r.netProfit, 0);

      // Prior values
      const priSalesRows = factSales.filter(r => r.sku === sku && r.periodTag === priorPeriod);
      const priRevenue = priSalesRows.reduce((sum, r) => sum + r.salesRevenue, 0);
      const priProfit = priSalesRows.reduce((sum, r) => sum + r.netProfit, 0);

      const revenueChange = curRevenue - priRevenue;
      const revenueGrowthRate = priRevenue !== 0 ? revenueChange / priRevenue : 0;
      const profitChange = curProfit - priProfit;

      return {
        sku,
        parentAsin,
        productName,
        curRevenue,
        priRevenue,
        revenueChange,
        revenueGrowthRate,
        curProfit,
        priProfit,
        profitChange,
        profitContributionRank: '' // to be calculated below
      };
    });

    // Sort by current period revenue descending
    rows.sort((a, b) => b.curRevenue - a.curRevenue);

    // 2. Compute Profit Contribution Rank
    // Only rank SKUs with profit drops (profitChange < 0)
    // The SKU with the largest drop (most negative) is ranked #1.
    const negativeProfitDrops = rows
      .filter(r => r.profitChange < 0)
      .map(r => r.profitChange)
      .sort((a, b) => a - b); // Ascending order: e.g. -2000, -1000, -500...

    rows = rows.map(row => {
      if (row.profitChange >= 0) {
        return { ...row, profitContributionRank: '—' };
      }
      // Rank is 1-based index in negativeProfitDrops list
      const rank = negativeProfitDrops.indexOf(row.profitChange) + 1;
      return {
        ...row,
        profitContributionRank: rank
      };
    });

    return rows;
  }, [factSales, skuMap, currentPeriod, priorPeriod]);

  // Max absolute changes for horizontal data bars
  const maxChangeVals = useMemo(() => {
    return {
      revenueChange: Math.max(...diagnosedRows.map(r => Math.abs(r.revenueChange)), 1),
      profitChange: Math.max(...diagnosedRows.map(r => Math.abs(r.profitChange)), 1),
    };
  }, [diagnosedRows]);

  // Find the biggest profit loser (Rank #1) for insight card
  const biggestProfitLoser = useMemo(() => {
    return diagnosedRows.find(r => r.profitContributionRank === 1);
  }, [diagnosedRows]);

  return (
    <div className="space-y-6 animate-fade-up" id="anly-sku-performance">
      {/* Header Info Block */}
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[var(--color-primary)]">
        <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block mb-1">
          Engine / SKU Change Diagnosis
        </span>
        <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
          Anly_SKU_Performance SKU Performance Diagnostic Engine
        </h2>
        <p className="text-[12px] text-[var(--color-muted)] mt-1">
          Compares metrics for current target period <span className="font-mono text-slate-800 font-semibold">{currentPeriod}</span> against comparison period <span className="font-mono text-slate-800 font-semibold">{priorPeriod}</span>. Isolate the key products causing profit leaks.
        </p>
      </div>

      {/* Insight Section */}
      {biggestProfitLoser && biggestProfitLoser.profitChange < -100 && (
        <div className="insight-block bg-[var(--insight-bg)] p-5 rounded-xl border-l-4 border-[var(--color-accent)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingDown size={24} className="text-[var(--color-negative)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif-heading text-base font-bold text-[var(--color-primary)]">
                Critical Profit Erosion Alert: SKU {biggestProfitLoser.sku}
              </h4>
              <p className="text-[12px] text-[var(--color-body-text)] mt-1 leading-relaxed">
                Our diagnosis has isolated <span className="font-mono font-bold text-[var(--color-primary)]">{biggestProfitLoser.sku}</span> ({biggestProfitLoser.productName}) as the biggest single profit leak. 
                Its net profit shrunk by <span className="font-mono text-[var(--color-negative)] font-bold">{formatCurrency(Math.abs(biggestProfitLoser.profitChange))}</span> this period. Check for elevated PPC spend, sudden Amazon fee spikes, or steep discounting.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block">
              Erosion Ranking
            </span>
            <span className="font-serif-display text-2xl font-black text-[var(--color-negative)]">
              Rank #1 Leak
            </span>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-12">No</th>
                <th className="px-4 py-3 font-semibold">Merchant SKU</th>
                <th className="px-4 py-3 font-semibold">Parent ASIN</th>
                <th className="px-4 py-3 font-semibold">Product Name Label</th>
                <th className="px-4 py-3 font-semibold text-right">Cur Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">Pri Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">Rev Change</th>
                <th className="px-4 py-3 font-semibold text-right">YoY/WoW %</th>
                <th className="px-4 py-3 font-semibold text-right">Cur Profit</th>
                <th className="px-4 py-3 font-semibold text-right">Pri Profit</th>
                <th className="px-4 py-3 font-semibold text-right">Profit Change</th>
                <th className="px-4 py-3 font-semibold text-center w-20">Erosion Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {diagnosedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                    No active SKU performance data found for period {currentPeriod}. Check your configurations or load more raw data.
                  </td>
                </tr>
              ) : (
                diagnosedRows.map((row, idx) => {
                  const revChgPct = Math.min((Math.abs(row.revenueChange) / maxChangeVals.revenueChange) * 100, 100);
                  const profChgPct = Math.min((Math.abs(row.profitChange) / maxChangeVals.profitChange) * 100, 100);

                  // Severe drop anomaly highlight (Profit change drops more than $200 and rank is top 3)
                  const isSevereAnomaly = row.profitChange < -100 && typeof row.profitContributionRank === 'number' && row.profitContributionRank <= 3;

                  return (
                    <tr
                      key={row.sku}
                      className={`transition-colors ${
                        isSevereAnomaly 
                          ? 'bg-[var(--anomaly-bg)] hover:bg-red-50/70' 
                          : 'even:bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-[var(--color-muted)] font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-[var(--color-primary)]">
                        {row.sku}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {row.parentAsin}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate max-w-[150px]" title={row.productName}>
                        {row.productName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--color-primary)]">{formatCurrency(row.curRevenue)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatCurrency(row.priRevenue)}</td>

                      {/* Revenue Change with Inline Data Bar */}
                      <td className={`px-4 py-3 text-right font-mono relative min-w-28 ${row.revenueChange < 0 ? 'text-[var(--color-negative)]' : 'text-slate-800'}`}>
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${revChgPct}%` }} 
                            className={`h-full ${row.revenueChange < 0 ? 'bg-[var(--color-negative)]' : 'bg-[var(--color-accent)]'} opacity-[0.05] rounded-sm`}
                          />
                        </div>
                        <span className="relative z-10 font-medium">
                          {row.revenueChange > 0 ? '+' : ''}{formatCurrency(row.revenueChange)}
                        </span>
                      </td>

                      <td className={`px-4 py-3 text-right font-mono ${row.revenueChange < 0 ? 'text-[var(--color-negative)]' : 'text-slate-600'}`}>
                        {row.revenueChange > 0 ? '+' : ''}{formatPercentOneDecimal(row.revenueGrowthRate)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-[var(--color-primary)]">{formatCurrency(row.curProfit)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatCurrency(row.priProfit)}</td>

                      {/* Profit Change with Inline Data Bar */}
                      <td className={`px-4 py-3 text-right font-mono relative min-w-32 ${row.profitChange < 0 ? 'text-[var(--color-negative)] font-semibold' : 'text-slate-800'}`}>
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${profChgPct}%` }} 
                            className={`h-full ${row.profitChange < 0 ? 'bg-[var(--color-negative)]' : 'bg-[var(--color-accent)]'} opacity-[0.05] rounded-sm`}
                          />
                        </div>
                        <span className="relative z-10">
                          {row.profitChange > 0 ? '+' : ''}{formatCurrency(row.profitChange)}
                        </span>
                      </td>

                      {/* Erosion Rank Badge */}
                      <td className="px-4 py-3 text-center">
                        {typeof row.profitContributionRank === 'number' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            row.profitContributionRank === 1 
                              ? 'bg-red-100 text-[var(--color-negative)] border border-red-200'
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            Rank {row.profitContributionRank}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-[var(--color-muted)] mt-3">
          Showing diagnostic results for {diagnosedRows.length} active products trading in {currentPeriod}.
        </div>
      </div>
    </div>
  );
}
