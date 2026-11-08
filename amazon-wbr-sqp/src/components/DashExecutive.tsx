/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { FactSalesRow, SKUMapRow, FactSQPRow } from '../types';
import { formatCurrency, formatInteger, formatPercent, formatPercentOneDecimal } from '../utils';
import { 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  BarChart2, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  Target, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  HelpCircle, 
  AlertTriangle 
} from 'lucide-react';

interface DashExecutiveProps {
  factSales: FactSalesRow[];
  skuMap: SKUMapRow[];
  factSqp: FactSQPRow[];
  currentPeriod: string;
  priorPeriod: string;
  onUpdatePeriod: (curr: string) => void;
  availablePeriods: string[];
}

export default function DashExecutive({
  factSales,
  skuMap,
  factSqp,
  currentPeriod,
  priorPeriod,
  onUpdatePeriod,
  availablePeriods
}: DashExecutiveProps) {

  // Interactive controls state for Multi-Dimension Growth & Decline analysis
  const [dimension, setDimension] = useState<'sku' | 'parentAsin' | 'productLine'>('sku');
  const [driverMetric, setDriverMetric] = useState<'revenue' | 'profit'>('profit');

  // Overall calculations for Current Period
  const curMetrics = useMemo(() => {
    const rows = factSales.filter(r => r.periodTag === currentPeriod);
    const revenue = rows.reduce((sum, r) => sum + r.salesRevenue, 0);
    const profit = rows.reduce((sum, r) => sum + r.netProfit, 0);
    const ppc = rows.reduce((sum, r) => sum + r.ppcSpend, 0);
    const acos = revenue > 0 ? ppc / revenue : 0;
    return { revenue, profit, ppc, acos, rowsCount: rows.length };
  }, [factSales, currentPeriod]);

  // Overall calculations for Prior Period
  const priMetrics = useMemo(() => {
    const rows = factSales.filter(r => r.periodTag === priorPeriod);
    const revenue = rows.reduce((sum, r) => sum + r.salesRevenue, 0);
    const profit = rows.reduce((sum, r) => sum + r.netProfit, 0);
    const ppc = rows.reduce((sum, r) => sum + r.ppcSpend, 0);
    const acos = revenue > 0 ? ppc / revenue : 0;
    return { revenue, profit, ppc, acos };
  }, [factSales, priorPeriod]);

  // Trends
  const trends = useMemo(() => {
    const calcChg = (cur: number, pri: number) => {
      if (pri === 0) return 0;
      return (cur - pri) / pri;
    };
    return {
      revenue: calcChg(curMetrics.revenue, priMetrics.revenue),
      profit: calcChg(curMetrics.profit, priMetrics.profit),
      ppc: calcChg(curMetrics.ppc, priMetrics.ppc),
      acos: curMetrics.acos - priMetrics.acos // Absolute basis points change
    };
  }, [curMetrics, priMetrics]);

  // 1. Dynamic Dimension Analysis (Drivers of Growth / Profit Decline)
  const dimensionAnalysis = useMemo(() => {
    const keysSet = new Set<string>();
    
    // helper to resolve key
    const getKey = (r: FactSalesRow) => {
      if (dimension === 'sku') return r.sku;
      if (dimension === 'parentAsin') return r.parentAsin;
      const m = skuMap.find(item => item.sku === r.sku);
      return m?.productLine || 'General Catalog';
    };

    factSales.forEach(r => {
      if (r.periodTag === currentPeriod || r.periodTag === priorPeriod) {
        keysSet.add(getKey(r));
      }
    });

    const keys = Array.from(keysSet);

    const results = keys.map(key => {
      const curRows = factSales.filter(r => getKey(r) === key && r.periodTag === currentPeriod);
      const priRows = factSales.filter(r => getKey(r) === key && r.periodTag === priorPeriod);

      const curRev = curRows.reduce((sum, r) => sum + r.salesRevenue, 0);
      const priRev = priRows.reduce((sum, r) => sum + r.salesRevenue, 0);
      const revChg = curRev - priRev;
      const revGrowth = priRev > 0 ? revChg / priRev : 0;

      const curProf = curRows.reduce((sum, r) => sum + r.netProfit, 0);
      const priProf = priRows.reduce((sum, r) => sum + r.netProfit, 0);
      const profChg = curProf - priProf;
      const profGrowth = priProf !== 0 ? profChg / Math.abs(priProf) : 0;

      let label = key;
      let sublabel = '';
      if (dimension === 'sku') {
        const m = skuMap.find(item => item.sku === key);
        label = key;
        sublabel = m?.name || 'Unmapped Product';
      } else if (dimension === 'parentAsin') {
        const m = skuMap.find(item => item.parentAsin === key);
        label = `Parent ASIN: ${key}`;
        sublabel = m ? m.productLine : 'Product Catalog';
      } else {
        label = key;
        sublabel = 'Product Group';
      }

      return {
        key,
        label,
        sublabel,
        curRev,
        priRev,
        revChg,
        revGrowth,
        curProf,
        priProf,
        profChg,
        profGrowth
      };
    });

    // Positive Drivers (growth)
    const sortedPositive = [...results]
      .filter(item => (driverMetric === 'revenue' ? item.revChg : item.profChg) > 0)
      .sort((a, b) => {
        const valA = driverMetric === 'revenue' ? a.revChg : a.profChg;
        const valB = driverMetric === 'revenue' ? b.revChg : b.profChg;
        return valB - valA;
      })
      .slice(0, 3);

    // Negative Contributors (decline)
    const sortedNegative = [...results]
      .filter(item => (driverMetric === 'revenue' ? item.revChg : item.profChg) < 0)
      .sort((a, b) => {
        const valA = driverMetric === 'revenue' ? a.revChg : a.profChg;
        const valB = driverMetric === 'revenue' ? b.revChg : b.profChg;
        return valA - valB; // Most negative first
      })
      .slice(0, 3);

    const maxAbsValue = Math.max(
      ...results.map(item => Math.abs(driverMetric === 'revenue' ? item.revChg : item.profChg)),
      1
    );

    return { positiveDrivers: sortedPositive, negativeDrivers: sortedNegative, maxAbsValue };
  }, [factSales, skuMap, currentPeriod, priorPeriod, dimension, driverMetric]);

  // 2. Scientific Traffic Loss Origin Diagnostic
  const trafficLossDiagnostic = useMemo(() => {
    const curSqp = factSqp.filter(r => r.period === currentPeriod);
    const priSqp = factSqp.filter(r => r.period === priorPeriod);

    if (curSqp.length === 0) {
      return {
        hasData: false,
        searchVolumeChange: 0,
        ctrBelowMarketPct: 0,
        cvrBelowMarketPct: 0,
        totalKeywords: 0,
        primaryLeakageReason: 'No SQP Data Loaded'
      };
    }

    // 1. Demand Trend: Search volume change of matched keywords
    let curVolSum = 0;
    let priVolSum = 0;
    let matchedCount = 0;

    curSqp.forEach(curKw => {
      const priKw = priSqp.find(p => p.searchQuery === curKw.searchQuery);
      if (priKw) {
        curVolSum += curKw.searchVolume;
        priVolSum += priKw.searchVolume;
        matchedCount++;
      }
    });

    const searchVolumeChange = priVolSum > 0 ? (curVolSum - priVolSum) / priVolSum : 0;

    // 2. CTR Gap: what % of core keywords have brandCtr < marketCtr
    const ctrBelowMarket = curSqp.filter(kw => kw.brandCtr < kw.marketCtr).length;
    const ctrBelowMarketPct = curSqp.length > 0 ? ctrBelowMarket / curSqp.length : 0;

    // 3. CVR Gap: what % of core keywords have brandCvr < marketCvr
    const cvrBelowMarket = curSqp.filter(kw => kw.brandCvr < kw.marketCvr).length;
    const cvrBelowMarketPct = curSqp.length > 0 ? cvrBelowMarket / curSqp.length : 0;

    // Diagnose primary origin of traffic leakage
    let primaryLeakageReason = 'Healthy Traffic Funnel';
    let recommendations: string[] = [];

    if (searchVolumeChange < -0.05) {
      recommendations.push('Market-wide contraction: Adjust stock planning & focus on defensive search rankings.');
    }
    if (ctrBelowMarketPct >= 0.5) {
      recommendations.push('ACoS & CTR pressure: Main image split-testing, pricing optimization, or ad match-type tightening.');
    }
    if (cvrBelowMarketPct >= 0.5) {
      recommendations.push('Conversion leak: Audit price elasticity, A+ content, customer reviews, or video assets.');
    }

    if (searchVolumeChange < -0.05 && ctrBelowMarketPct < 0.4 && cvrBelowMarketPct < 0.4) {
      primaryLeakageReason = 'Shrinking Market Demand (External contraction)';
    } else if (ctrBelowMarketPct >= 0.5 && ctrBelowMarketPct >= cvrBelowMarketPct) {
      primaryLeakageReason = 'Weaker Click-Through Rates (Listing Impression & Pricing Gaps)';
    } else if (cvrBelowMarketPct >= 0.5 && cvrBelowMarketPct > ctrBelowMarketPct) {
      primaryLeakageReason = 'Declining Conversion Performance (Detail Page & Review Gaps)';
    } else if (ctrBelowMarketPct >= 0.4 && cvrBelowMarketPct >= 0.4) {
      primaryLeakageReason = 'Double Deficit (Both Click-Through and Conversion Benchmarks Lagging)';
    }

    return {
      hasData: true,
      searchVolumeChange,
      ctrBelowMarketPct,
      cvrBelowMarketPct,
      totalKeywords: curSqp.length,
      primaryLeakageReason,
      recommendations: recommendations.length > 0 ? recommendations : ['All traffic indicators performing within healthy ranges. Ensure target bids are competitive.']
    };
  }, [factSqp, currentPeriod, priorPeriod]);

  // 3. Early Warning Keywords Losing Purchase Share
  const earlyWarningShareLossKeywords = useMemo(() => {
    const curSqp = factSqp.filter(r => r.period === currentPeriod);
    
    return curSqp.map(kw => {
      const priorKw = factSqp.find(p => p.searchQuery === kw.searchQuery && p.period === priorPeriod);
      const curShare = kw.purchaseShare;
      const priShare = priorKw ? priorKw.purchaseShare : 0;
      const shareChange = curShare - priShare;

      return {
        searchQuery: kw.searchQuery,
        curShare,
        priShare,
        shareChange,
        searchVolume: kw.searchVolume
      };
    })
    .filter(item => item.shareChange < -0.003) // Dropping brand buy share
    .sort((a, b) => a.shareChange - b.shareChange) // Worst drop first
    .slice(0, 3);
  }, [factSqp, currentPeriod, priorPeriod]);

  // 4. Multi-Period Historical Performance Ledger (WoW / MoM review)
  const historicalRows = useMemo(() => {
    // Generate chronological KPI snapshots
    const rows = availablePeriods.map((period, idx) => {
      const periodRows = factSales.filter(r => r.periodTag === period);
      const revenue = periodRows.reduce((sum, r) => sum + r.salesRevenue, 0);
      const profit = periodRows.reduce((sum, r) => sum + r.netProfit, 0);
      const ppc = periodRows.reduce((sum, r) => sum + r.ppcSpend, 0);
      const acos = revenue > 0 ? ppc / revenue : 0;

      // Since list is sorted descending (newest first), prior is at idx + 1
      let prevRevenue = 0;
      let prevProfit = 0;
      let prevPpc = 0;
      let prevAcos = 0;

      if (idx < availablePeriods.length - 1) {
        const prevPeriod = availablePeriods[idx + 1];
        const prevRows = factSales.filter(r => r.periodTag === prevPeriod);
        prevRevenue = prevRows.reduce((sum, r) => sum + r.salesRevenue, 0);
        prevProfit = prevRows.reduce((sum, r) => sum + r.netProfit, 0);
        prevPpc = prevRows.reduce((sum, r) => sum + r.ppcSpend, 0);
        prevAcos = prevRevenue > 0 ? prevPpc / prevRevenue : 0;
      }

      const revChg = prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : 0;
      const profChg = prevProfit !== 0 ? (profit - prevProfit) / Math.abs(prevProfit) : 0;
      const ppcChg = prevPpc > 0 ? (ppc - prevPpc) / prevPpc : 0;
      const acosChg = acos - prevAcos;

      return {
        period,
        revenue,
        revChg,
        profit,
        profChg,
        ppc,
        ppcChg,
        acos,
        acosChg,
        hasPrior: idx < availablePeriods.length - 1
      };
    });
    return rows;
  }, [factSales, availablePeriods]);

  // Anomaly warnings
  const hasSevereProfitErosion = dimensionAnalysis.negativeDrivers.some(s => s.profChg < -0.15);
  const hasSevereShareErosion = earlyWarningShareLossKeywords.some(k => k.shareChange < -0.01);

  return (
    <div className="space-y-8 animate-fade-up" id="dash-executive">
      
      {/* ─── TOP CONTROLS & GREETING ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-md border-b border-[var(--color-border)]" id="dash-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-accent)] uppercase block">
              Executive Performance Cockpit
            </span>
            <span className="text-[10px] bg-blue-50 text-[var(--color-accent)] px-2 py-0.5 rounded-full font-mono">
              Auto-Compiled Database
            </span>
          </div>
          <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
            Amazon Business Review Executive Dashboard
          </h2>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            Replicates high-end SaaS analytics. Tracks weekly, monthly, and yearly business metrics with zero manual rebuilding.
          </p>
        </div>
        
        {/* Dynamic Period Selector */}
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase shrink-0" htmlFor="period-selector">
            Select Analysis Period:
          </label>
          <select
            id="period-selector"
            value={currentPeriod}
            onChange={(e) => onUpdatePeriod(e.target.value)}
            className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md px-4 py-1.5 text-[13px] text-[var(--color-primary)] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer shadow-sm hover:brightness-95 transition-all"
          >
            {availablePeriods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── EXECUTIVE KPI CARD GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-grid">
        {/* Card 1: Sales Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-md card relative overflow-hidden" id="kpi-revenue">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
              Sales Revenue
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              vs {priorPeriod}
            </span>
          </div>
          <p className="font-serif-display text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            {formatCurrency(curMetrics.revenue)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              Prev: {formatCurrency(priMetrics.revenue)}
            </span>
            <span className={`font-semibold flex items-center gap-0.5 font-sans ${trends.revenue > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trends.revenue > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
              {formatPercentOneDecimal(Math.abs(trends.revenue))}
            </span>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white p-6 rounded-xl shadow-md card relative overflow-hidden" id="kpi-profit">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
              Net Profit
            </span>
            {curMetrics.profit < 0 ? (
              <span className="text-[10px] bg-red-100 text-[var(--color-negative)] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Loss
              </span>
            ) : (
              <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Healthy
              </span>
            )}
          </div>
          <p className={`font-serif-display text-3xl font-bold tracking-tight ${curMetrics.profit < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-primary)]'}`}>
            {formatCurrency(curMetrics.profit)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              Prev: {formatCurrency(priMetrics.profit)}
            </span>
            <span className={`font-semibold flex items-center gap-0.5 font-sans ${trends.profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trends.profit > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
              {formatPercentOneDecimal(Math.abs(trends.profit))}
            </span>
          </div>
        </div>

        {/* Card 3: PPC Spend */}
        <div className="bg-white p-6 rounded-xl shadow-md card relative overflow-hidden" id="kpi-ppc">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
              PPC Spend
            </span>
          </div>
          <p className="font-serif-display text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            {formatCurrency(curMetrics.ppc)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              Prev: {formatCurrency(priMetrics.ppc)}
            </span>
            <span className={`font-semibold flex items-center gap-0.5 font-sans ${trends.ppc < 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {trends.ppc > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} 
              {formatPercentOneDecimal(Math.abs(trends.ppc))}
            </span>
          </div>
        </div>

        {/* Card 4: Overall ACoS */}
        <div className="bg-white p-6 rounded-xl shadow-md card relative overflow-hidden" id="kpi-acos">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
              Overall ACoS
            </span>
          </div>
          <p className="font-serif-display text-3xl font-bold text-[var(--color-accent)] tracking-tight">
            {formatPercent(curMetrics.acos)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              Prev: {formatPercent(priMetrics.acos)}
            </span>
            <span className={`font-semibold flex items-center gap-0.5 font-sans ${trends.acos <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trends.acos > 0 ? '▲ +' : '▼ -'}{formatPercent(Math.abs(trends.acos))}
            </span>
          </div>
        </div>
      </div>

      {/* ─── SEVERE DIAGNOSTIC WARNINGS ─── */}
      {(hasSevereProfitErosion || hasSevereShareErosion) && (
        <div className="insight-block bg-red-50/50 p-5 rounded-xl border-l-4 border-[var(--color-negative)] flex items-start gap-3 shadow-sm" id="severe-warnings">
          <ShieldAlert size={20} className="text-[var(--color-negative)] shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="font-serif-heading text-base font-bold text-[var(--color-negative)]">
              Severe Diagnostics Warnings Triggered (Action Required)
            </h4>
            <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">
              Active leaks detected this period. {hasSevereProfitErosion && "At least one product line/SKU is suffering material profit decline."} {hasSevereShareErosion && "Core search keywords are experiencing significant purchase share erosion."} Locate specific root causes below.
            </p>
          </div>
        </div>
      )}

      {/* ─── NEW FEATURE 1: MULTI-DIMENSION GROWTH & DECLINE DRIVERS ─── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)]" id="dimension-analysis-container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6 gap-4">
          <div>
            <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
              Growth Drivers &amp; Decline Culprit Backtracking
            </h3>
            <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
              Isolate performance contributors by SKU, Parent ASIN, or Product Group
            </p>
          </div>
          
          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase">Analyze By:</span>
              <div className="inline-flex rounded-md shadow-sm bg-slate-100 p-0.5">
                {[
                  { id: 'sku', label: 'SKU' },
                  { id: 'parentAsin', label: 'Parent ASIN' },
                  { id: 'productLine', label: 'Product Group' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDimension(item.id as any)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      dimension === item.id 
                        ? 'bg-white text-[var(--color-primary)] shadow-sm' 
                        : 'text-slate-500 hover:text-[var(--color-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase">Metric:</span>
              <div className="inline-flex rounded-md shadow-sm bg-slate-100 p-0.5">
                {[
                  { id: 'revenue', label: 'Revenue' },
                  { id: 'profit', label: 'Net Profit' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDriverMetric(item.id as any)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      driverMetric === item.id 
                        ? 'bg-white text-[var(--color-primary)] shadow-sm' 
                        : 'text-slate-500 hover:text-[var(--color-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Positive Growth Drivers */}
          <div className="space-y-4" id="positive-drivers">
            <div className="flex items-center gap-2 border-b border-green-100 pb-2">
              <span className="p-1 rounded bg-green-50 text-green-600">
                <TrendingUp size={16} />
              </span>
              <h4 className="font-serif-heading text-[15px] font-bold text-green-700">
                Top Growth Drivers (Positive Change)
              </h4>
            </div>

            {dimensionAnalysis.positiveDrivers.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-muted)] italic text-[12px]">
                No growth drivers found for the selected configuration.
              </div>
            ) : (
              <div className="space-y-3">
                {dimensionAnalysis.positiveDrivers.map((item, idx) => {
                  const val = driverMetric === 'revenue' ? item.revChg : item.profChg;
                  const pct = Math.min((Math.abs(val) / dimensionAnalysis.maxAbsValue) * 100, 100);
                  const growthRate = driverMetric === 'revenue' ? item.revGrowth : item.profGrowth;

                  return (
                    <div key={item.key} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 relative overflow-hidden hover:shadow-sm transition-all">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[13px] text-[var(--color-primary)]">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--color-muted)] truncate max-w-[280px] block mt-0.5">
                            {item.sublabel}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[13px] text-green-600 font-bold block">
                            +{formatCurrency(val)}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Rate: +{formatPercentOneDecimal(growthRate)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Visual bar tracker */}
                      <div className="mt-2.5">
                        <div className="bar-track w-full bg-green-100">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="bar-fill bg-green-500" 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Profit Decline Culprits */}
          <div className="space-y-4" id="negative-drivers">
            <div className="flex items-center gap-2 border-b border-red-100 pb-2">
              <span className="p-1 rounded bg-red-50 text-[var(--color-negative)]">
                <TrendingDown size={16} />
              </span>
              <h4 className="font-serif-heading text-[15px] font-bold text-[var(--color-negative)]">
                Primary Decline Culprits (Negative Change)
              </h4>
            </div>

            {dimensionAnalysis.negativeDrivers.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-muted)] italic text-[12px]">
                No contraction culprits detected. Excellent catalogs health!
              </div>
            ) : (
              <div className="space-y-3">
                {dimensionAnalysis.negativeDrivers.map((item, idx) => {
                  const val = driverMetric === 'revenue' ? item.revChg : item.profChg;
                  const pct = Math.min((Math.abs(val) / dimensionAnalysis.maxAbsValue) * 100, 100);
                  const growthRate = driverMetric === 'revenue' ? item.revGrowth : item.profGrowth;

                  return (
                    <div key={item.key} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 relative overflow-hidden hover:shadow-sm transition-all">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-negative)]" />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[13px] text-[var(--color-primary)]">
                              {item.key}
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--color-muted)] truncate max-w-[280px] block mt-0.5">
                            {item.sublabel}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[13px] text-[var(--color-negative)] font-bold block">
                            -{formatCurrency(Math.abs(val))}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Rate: {formatPercentOneDecimal(growthRate)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Visual bar tracker */}
                      <div className="mt-2.5">
                        <div className="bar-track w-full bg-red-100">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="bar-fill bg-[var(--color-negative)]" 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── NEW FEATURE 2: SCIENTIFIC TRAFFIC LOSS ORIGIN DIAGNOSTICS ─── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)]" id="traffic-diagnostics-container">
        <div className="border-b border-[var(--color-border)] pb-4 mb-6">
          <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
            Traffic Loss Origin Diagnostics Engine (SQP Intelligence)
          </h3>
          <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
            Determines whether traffic losses originate from Market Demand, CTR constraints, or CVR Gaps
          </p>
        </div>

        {!trafficLossDiagnostic.hasData ? (
          <div className="py-8 text-center text-[var(--color-muted)] font-serif-heading italic">
            Search Query Performance (SQP) data missing for this period. Upload SQP reports in Raw_SQP to unlock funnel origin auditing.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Summary Diagnostic Panel */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-[var(--color-accent)] text-white px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Engine Ruling
                </span>
                <h4 className="font-serif-heading text-base font-bold text-[var(--color-primary)] mt-1.5">
                  Primary Leakage Vector: <span className="text-[var(--color-accent)]">{trafficLossDiagnostic.primaryLeakageReason}</span>
                </h4>
                <p className="text-[12px] text-slate-600 mt-1">
                  Automated auditing based on Amazon Search Query Performance benchmarks.
                </p>
              </div>
              <div className="text-left md:text-right shrink-0">
                <span className="text-[10px] text-[var(--color-muted)] uppercase font-semibold block">Audit Sample Size</span>
                <span className="font-mono text-xl font-bold text-[var(--color-primary)]">
                  {trafficLossDiagnostic.totalKeywords} Core Keywords
                </span>
              </div>
            </div>

            {/* Three Pillar Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Pillar 1: Market Demand */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    1. Market Demand (Volume)
                  </span>
                  <Search size={16} className="text-slate-400" />
                </div>
                <p className={`font-serif-display text-2xl font-black ${trafficLossDiagnostic.searchVolumeChange < 0 ? 'text-[var(--color-negative)]' : 'text-green-600'}`}>
                  {trafficLossDiagnostic.searchVolumeChange > 0 ? '+' : ''}{formatPercentOneDecimal(trafficLossDiagnostic.searchVolumeChange)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1.5 leading-relaxed">
                  Market search volume trend across all core search queries. Negative change indicates shrinking macro demand.
                </span>
              </div>

              {/* Pillar 2: CTR Performance */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    2. CTR Benchmark Deficit
                  </span>
                  <Target size={16} className="text-slate-400" />
                </div>
                <p className={`font-serif-display text-2xl font-black ${trafficLossDiagnostic.ctrBelowMarketPct >= 0.5 ? 'text-[var(--color-negative)]' : 'text-slate-700'}`}>
                  {formatPercent(trafficLossDiagnostic.ctrBelowMarketPct)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1.5 leading-relaxed">
                  Percentage of queries where Brand CTR lags market average. Above 50% points to listing impression/main image deficits.
                </span>
              </div>

              {/* Pillar 3: CVR Performance */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    3. CVR Benchmark Deficit
                  </span>
                  <Users size={16} className="text-slate-400" />
                </div>
                <p className={`font-serif-display text-2xl font-black ${trafficLossDiagnostic.cvrBelowMarketPct >= 0.5 ? 'text-[var(--color-negative)]' : 'text-slate-700'}`}>
                  {formatPercent(trafficLossDiagnostic.cvrBelowMarketPct)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1.5 leading-relaxed">
                  Percentage of queries where Brand CVR lags market average. Above 50% points to detail page layout or reviews leaks.
                </span>
              </div>

            </div>

            {/* Action Recommendations List */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
              <h5 className="font-semibold text-[12px] text-[var(--color-accent)] uppercase tracking-wider mb-2">
                Operational Playbook Recommendations:
              </h5>
              <ul className="space-y-1.5">
                {trafficLossDiagnostic.recommendations.map((rec, i) => (
                  <li key={i} className="text-[12px] text-slate-700 flex items-start gap-2">
                    <span className="text-[var(--color-accent)] mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* ─── TWO DETAILED DIAGNOSTIC PANELS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="worst-performers-grid">
        {/* Card Component 1: Top 5 Worst Profit-Loss SKUs */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)] flex flex-col justify-between" id="diagnose-sku-panel">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
                  Top 5 Profit-Loss SKU Diagnosis
                </h3>
                <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
                  Primary profit erosion culprits (Cur vs Pri)
                </p>
              </div>
              <span className="text-[10px] bg-red-100 text-[var(--color-negative)] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Leaks
              </span>
            </div>

            {dimensionAnalysis.negativeDrivers.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                No active profit erosion detected among trading SKUs this period. Excellent health!
              </div>
            ) : (
              <div className="space-y-4">
                {dimensionAnalysis.negativeDrivers.slice(0, 5).map((item) => {
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border-l-3 border-[var(--color-negative)] hover:translate-x-1 transition-all duration-150"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[13px] text-[var(--color-primary)]">
                            {item.key}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-muted)] truncate max-w-[200px] mt-0.5">
                          {item.sublabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px] text-[var(--color-negative)] font-semibold block">
                          -{formatCurrency(Math.abs(driverMetric === 'revenue' ? item.revChg : item.profChg))}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-mono">
                          Curr: {formatCurrency(driverMetric === 'revenue' ? item.curRev : item.curProf)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] pt-4 mt-4 border-t border-slate-100">
            * Sorting absolute drops in net earnings to identify critical margins leaks.
          </div>
        </div>

        {/* Card Component 2: Keyword Early Warning share leaks */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)] flex flex-col justify-between" id="diagnose-keywords-panel">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
                  Keyword Purchase Share Leaks
                </h3>
                <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
                  Core traffic leakage queries (Cur vs Pri)
                </p>
              </div>
              <span className="text-[10px] bg-red-100 text-[var(--color-negative)] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Early Warning
              </span>
            </div>

            {earlyWarningShareLossKeywords.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                No market share drop observed on core search queries this period.
              </div>
            ) : (
              <div className="space-y-4">
                {earlyWarningShareLossKeywords.map((item) => {
                  return (
                    <div
                      key={item.searchQuery}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border-l-3 border-[var(--color-negative)] hover:translate-x-1 transition-all duration-150"
                    >
                      <div>
                        <span className="font-medium text-[13px] text-[var(--color-primary)] block truncate max-w-[250px]">
                          "{item.searchQuery}"
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-mono">
                          Search Vol: {formatInteger(item.searchVolume)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px] text-[var(--color-negative)] font-semibold block">
                          -{formatPercent(Math.abs(item.shareChange))}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-mono">
                          Curr: {formatPercent(item.curShare)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] pt-4 mt-4 border-t border-slate-100">
            * Identifies declining brand buy-funnel share on high-volume traffic channels.
          </div>
        </div>
      </div>

      {/* ─── NEW FEATURE 3: STANDARD EXECUTIVE HISTORICAL BUSINESS REVIEW (WoW/MoM LEDGER) ─── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)]" id="historical-review-container">
        <div className="border-b border-[var(--color-border)] pb-4 mb-4">
          <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
            Standard Executive Historical Business Ledger
          </h3>
          <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
            Aggregated business review history with consistent period-over-period comparisons
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]" id="historical-review-table">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">Period Tag</th>
                <th className="px-4 py-3 text-right font-semibold">Sales Revenue</th>
                <th className="px-4 py-3 text-right font-semibold">Revenue Change</th>
                <th className="px-4 py-3 text-right font-semibold">Net Profit</th>
                <th className="px-4 py-3 text-right font-semibold">Profit Change</th>
                <th className="px-4 py-3 text-right font-semibold">PPC Spend</th>
                <th className="px-4 py-3 text-right font-semibold">Spend Change</th>
                <th className="px-4 py-3 text-right font-semibold">ACoS</th>
                <th className="px-4 py-3 text-right font-semibold">ACoS Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {historicalRows.map((row) => (
                <tr 
                  key={row.period} 
                  className={`transition-colors cursor-pointer ${
                    row.period === currentPeriod 
                      ? 'bg-blue-50/50 hover:bg-blue-50 font-medium' 
                      : 'even:bg-slate-50/60 hover:bg-slate-50'
                  }`}
                  onClick={() => onUpdatePeriod(row.period)}
                  title="Click to load this analysis period as primary"
                >
                  <td className="px-4 py-3 font-mono font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                    {row.period === currentPeriod && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                    )}
                    {row.period}
                  </td>
                  
                  {/* Sales */}
                  <td className="px-4 py-3 text-right font-mono text-slate-800">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-[11px] ${
                    !row.hasPrior ? 'text-slate-400' : row.revChg >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {!row.hasPrior ? '—' : `${row.revChg >= 0 ? '▲ +' : '▼ '}${formatPercentOneDecimal(row.revChg)}`}
                  </td>

                  {/* Profit */}
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${row.profit < 0 ? 'text-[var(--color-negative)]' : 'text-slate-800'}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-[11px] ${
                    !row.hasPrior ? 'text-slate-400' : row.profChg >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {!row.hasPrior ? '—' : `${row.profChg >= 0 ? '▲ +' : '▼ '}${formatPercentOneDecimal(row.profChg)}`}
                  </td>

                  {/* PPC */}
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatCurrency(row.ppc)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-[11px] ${
                    !row.hasPrior ? 'text-slate-400' : row.ppcChg <= 0 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {!row.hasPrior ? '—' : `${row.ppcChg >= 0 ? '▲ +' : '▼ '}${formatPercentOneDecimal(row.ppcChg)}`}
                  </td>

                  {/* ACoS */}
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {formatPercent(row.acos)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-[11px] ${
                    !row.hasPrior ? 'text-slate-400' : row.acosChg <= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {!row.hasPrior ? '—' : `${row.acosChg > 0 ? '+' : ''}${formatPercent(row.acosChg)}`}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-[var(--color-muted)] mt-3">
          * Consistent WoW / MoM Comparisons are generated dynamically by comparing adjacent periods chronologically. Click any row to set it as active.
        </div>
      </div>

    </div>
  );
}
