// 2026-11-08: 简体中文界面适配；保留原作者 Apache-2.0 许可证。
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
      return m?.productLine || "未分类产品线";
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
        sublabel = m?.name || "未匹配商品";
      } else if (dimension === 'parentAsin') {
        const m = skuMap.find(item => item.parentAsin === key);
        label = `父 ASIN：${key}`;
        sublabel = m ? m.productLine : "商品目录";
      } else {
        label = key;
        sublabel = "产品组";
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
        primaryLeakageReason: "尚未导入搜索词数据"
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
    let primaryLeakageReason = "流量漏斗指标正常";
    let recommendations: string[] = [];

    if (searchVolumeChange < -0.05) {
      recommendations.push("市场搜索需求下降：结合实际情况检查备货计划与核心搜索词表现。");
    }
    if (ctrBelowMarketPct >= 0.5) {
      recommendations.push("点击率承压：可检查主图、定价及广告匹配方式，并通过对照测试验证。");
    }
    if (cvrBelowMarketPct >= 0.5) {
      recommendations.push("转化率偏低：可检查价格、A+ 页面、客户评价及视频内容。");
    }

    if (searchVolumeChange < -0.05 && ctrBelowMarketPct < 0.4 && cvrBelowMarketPct < 0.4) {
      primaryLeakageReason = "市场搜索需求下降（外部需求变化）";
    } else if (ctrBelowMarketPct >= 0.5 && ctrBelowMarketPct >= cvrBelowMarketPct) {
      primaryLeakageReason = "点击率偏低（需检查商品展示与价格）";
    } else if (cvrBelowMarketPct >= 0.5 && cvrBelowMarketPct > ctrBelowMarketPct) {
      primaryLeakageReason = "转化表现下降（需检查详情页与评价）";
    } else if (ctrBelowMarketPct >= 0.4 && cvrBelowMarketPct >= 0.4) {
      primaryLeakageReason = "双重不足（点击率与转化率均低于基准）";
    }

    return {
      hasData: true,
      searchVolumeChange,
      ctrBelowMarketPct,
      cvrBelowMarketPct,
      totalKeywords: curSqp.length,
      primaryLeakageReason,
      recommendations: recommendations.length > 0 ? recommendations : ["当前流量指标处于规则设定的正常范围，可继续观察出价与转化表现。"]
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
              经营分析中心
            </span>
            <span className="text-[10px] bg-blue-50 text-[var(--color-accent)] px-2 py-0.5 rounded-full font-mono">
              数据自动汇总
            </span>
          </div>
          <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
            亚马逊经营周报与搜索词分析看板
          </h2>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            按周期查看销售、利润与广告投入，分析商品贡献和搜索词表现。
          </p>
        </div>
        
        {/* Dynamic Period Selector */}
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase shrink-0" htmlFor="period-selector">
            选择分析周期：
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
              销售额
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              对比 {priorPeriod}
            </span>
          </div>
          <p className="font-serif-display text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            {formatCurrency(curMetrics.revenue)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              上期： {formatCurrency(priMetrics.revenue)}
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
              净利润
            </span>
            {curMetrics.profit < 0 ? (
              <span className="text-[10px] bg-red-100 text-[var(--color-negative)] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                亏损
              </span>
            ) : (
              <span className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                盈利
              </span>
            )}
          </div>
          <p className={`font-serif-display text-3xl font-bold tracking-tight ${curMetrics.profit < 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-primary)]'}`}>
            {formatCurrency(curMetrics.profit)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              上期： {formatCurrency(priMetrics.profit)}
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
              广告花费
            </span>
          </div>
          <p className="font-serif-display text-3xl font-bold text-[var(--color-primary)] tracking-tight">
            {formatCurrency(curMetrics.ppc)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              上期： {formatCurrency(priMetrics.ppc)}
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
              广告总费比（TACOS）
            </span>
          </div>
          <p className="font-serif-display text-3xl font-bold text-[var(--color-accent)] tracking-tight">
            {formatPercent(curMetrics.acos)}
          </p>
          <div className="flex items-center justify-between mt-3 border-t border-[var(--color-border)] pt-2 text-[12px]">
            <span className="text-[var(--color-muted)] font-mono">
              上期： {formatPercent(priMetrics.acos)}
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
              重点经营变化提醒
            </h4>
            <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">
              本期检测到以下变化： {hasSevereProfitErosion && "部分产品线或商品的利润出现下降。"} {hasSevereShareErosion && "部分核心搜索词的购买份额下降。"} 请结合下方明细进一步核查，规则提示不代表因果已确认。
            </p>
          </div>
        </div>
      )}

      {/* ─── NEW FEATURE 1: MULTI-DIMENSION GROWTH & DECLINE DRIVERS ─── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)]" id="dimension-analysis-container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6 gap-4">
          <div>
            <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
              增长贡献与下降贡献分析
            </h3>
            <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
              按 SKU、父 ASIN 或产品组查看变化贡献
            </p>
          </div>
          
          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase">分析维度：</span>
              <div className="inline-flex rounded-md shadow-sm bg-slate-100 p-0.5">
                {[
                  { id: 'sku', label: 'SKU' },
                  { id: 'parentAsin', label: "父 ASIN" },
                  { id: 'productLine', label: "产品组" }
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
              <span className="text-[11px] font-semibold text-[var(--color-muted)] uppercase">分析指标：</span>
              <div className="inline-flex rounded-md shadow-sm bg-slate-100 p-0.5">
                {[
                  { id: 'revenue', label: "销售额" },
                  { id: 'profit', label: "净利润" }
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
                主要增长贡献（正向变化）
              </h4>
            </div>

            {dimensionAnalysis.positiveDrivers.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-muted)] italic text-[12px]">
                当前条件下暂无正向增长贡献。
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
                            变化率：+{formatPercentOneDecimal(growthRate)}
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
                主要下降贡献（负向变化）
              </h4>
            </div>

            {dimensionAnalysis.negativeDrivers.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-muted)] italic text-[12px]">
                当前条件下暂无负向变化贡献。
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
                            变化率： {formatPercentOneDecimal(growthRate)}
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
            搜索词流量与转化诊断
          </h3>
          <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
            对比市场搜索需求、点击率和转化率，辅助排查流量变化
          </p>
        </div>

        {!trafficLossDiagnostic.hasData ? (
          <div className="py-8 text-center text-[var(--color-muted)] font-serif-heading italic">
            本期暂无搜索词数据，请在「搜索词原始数据」中导入报表。
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Summary Diagnostic Panel */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-[var(--color-accent)] text-white px-2 py-0.5 rounded font-mono font-bold uppercase">
                  规则分析结果
                </span>
                <h4 className="font-serif-heading text-base font-bold text-[var(--color-primary)] mt-1.5">
                  主要关注方向： <span className="text-[var(--color-accent)]">{trafficLossDiagnostic.primaryLeakageReason}</span>
                </h4>
                <p className="text-[12px] text-slate-600 mt-1">
                  根据搜索词报表与市场基准进行规则分析，结论需结合实际业务验证。
                </p>
              </div>
              <div className="text-left md:text-right shrink-0">
                <span className="text-[10px] text-[var(--color-muted)] uppercase font-semibold block">本期分析样本</span>
                <span className="font-mono text-xl font-bold text-[var(--color-primary)]">
                  {trafficLossDiagnostic.totalKeywords} 个核心关键词
                </span>
              </div>
            </div>

            {/* Three Pillar Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Pillar 1: Market Demand */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    1. 市场搜索需求变化
                  </span>
                  <Search size={16} className="text-slate-400" />
                </div>
                <p className={`font-serif-display text-2xl font-black ${trafficLossDiagnostic.searchVolumeChange < 0 ? 'text-[var(--color-negative)]' : 'text-green-600'}`}>
                  {trafficLossDiagnostic.searchVolumeChange > 0 ? '+' : ''}{formatPercentOneDecimal(trafficLossDiagnostic.searchVolumeChange)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1.5 leading-relaxed">
                  核心搜索词的市场总搜索量变化；负值表示样本搜索词的需求下降。
                </span>
              </div>

              {/* Pillar 2: CTR Performance */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    2. 点击率低于基准的占比
                  </span>
                  <Target size={16} className="text-slate-400" />
                </div>
                <p className={`font-serif-display text-2xl font-black ${trafficLossDiagnostic.ctrBelowMarketPct >= 0.5 ? 'text-[var(--color-negative)]' : 'text-slate-700'}`}>
                  {formatPercent(trafficLossDiagnostic.ctrBelowMarketPct)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1.5 leading-relaxed">
                  品牌点击率低于市场基准的关键词比例，超过 50% 时提示检查主图、价格等因素。
                </span>
              </div>

              {/* Pillar 3: CVR Performance */}
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    3. 转化率低于基准的占比
                  </span>
                  <Users size={16} className="text-slate-400" />
                </div>
                <p className={`font-serif-display text-2xl font-black ${trafficLossDiagnostic.cvrBelowMarketPct >= 0.5 ? 'text-[var(--color-negative)]' : 'text-slate-700'}`}>
                  {formatPercent(trafficLossDiagnostic.cvrBelowMarketPct)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1.5 leading-relaxed">
                  品牌转化率低于市场基准的关键词比例，超过 50% 时提示检查详情页与评价等因素。
                </span>
              </div>

            </div>

            {/* Action Recommendations List */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
              <h5 className="font-semibold text-[12px] text-[var(--color-accent)] uppercase tracking-wider mb-2">
                可进一步核查的方向：
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
                  重点商品利润下降明细
                </h3>
                <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
                  本期与上期的利润变化
                </p>
              </div>
              <span className="text-[10px] bg-red-100 text-[var(--color-negative)] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                下降关注
              </span>
            </div>

            {dimensionAnalysis.negativeDrivers.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                本期商品暂无利润下降记录。
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
                          本期： {formatCurrency(driverMetric === 'revenue' ? item.curRev : item.curProf)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] pt-4 mt-4 border-t border-slate-100">
            * 按净利润减少金额排序，帮助识别利润变化较大的商品。
          </div>
        </div>

        {/* Card Component 2: Keyword Early Warning share leaks */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)] flex flex-col justify-between" id="diagnose-keywords-panel">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
              <div>
                <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
                  搜索词购买份额下降
                </h3>
                <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
                  核心搜索词的本期与上期对比
                </p>
              </div>
              <span className="text-[10px] bg-red-100 text-[var(--color-negative)] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                份额预警
              </span>
            </div>

            {earlyWarningShareLossKeywords.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                本期核心搜索词暂无符合规则的购买份额下降。
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
                          搜索量： {formatInteger(item.searchVolume)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px] text-[var(--color-negative)] font-semibold block">
                          -{formatPercent(Math.abs(item.shareChange))}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-mono">
                          本期： {formatPercent(item.curShare)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="text-[11px] text-[var(--color-muted)] pt-4 mt-4 border-t border-slate-100">
            * 识别高搜索量关键词中品牌购买份额下降的记录。
          </div>
        </div>
      </div>

      {/* ─── NEW FEATURE 3: STANDARD EXECUTIVE HISTORICAL BUSINESS REVIEW (WoW/MoM LEDGER) ─── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-[var(--color-border)]" id="historical-review-container">
        <div className="border-b border-[var(--color-border)] pb-4 mb-4">
          <h3 className="font-serif-heading text-lg font-bold text-[var(--color-primary)]">
            历史周期经营汇总
          </h3>
          <p className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider font-semibold">
            按周期汇总经营表现，并与相邻的有数据周期进行对比
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]" id="historical-review-table">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">统计周期</th>
                <th className="px-4 py-3 text-right font-semibold">销售额</th>
                <th className="px-4 py-3 text-right font-semibold">销售额变化率</th>
                <th className="px-4 py-3 text-right font-semibold">净利润</th>
                <th className="px-4 py-3 text-right font-semibold">利润变化</th>
                <th className="px-4 py-3 text-right font-semibold">广告花费</th>
                <th className="px-4 py-3 text-right font-semibold">花费变化率</th>
                <th className="px-4 py-3 text-right font-semibold">广告总费比</th>
                <th className="px-4 py-3 text-right font-semibold">费比变化（百分点）</th>
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
                  title="点击切换到此分析周期"
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
          * 按时间顺序比较相邻的有数据周期；点击记录可切换当前分析周期。
        </div>
      </div>

    </div>
  );
}
