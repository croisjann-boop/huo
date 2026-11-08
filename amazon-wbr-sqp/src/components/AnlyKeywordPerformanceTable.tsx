// 2026-11-08: 简体中文界面适配；保留原作者 Apache-2.0 许可证。
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { FactSQPRow, AnlyKeywordPerformanceRow } from '../types';
import { formatInteger, formatPercent, formatPercentOneDecimal } from '../utils';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface AnlyKeywordPerformanceTableProps {
  factSqp: FactSQPRow[];
  currentPeriod: string;
  priorPeriod: string;
}

export default function AnlyKeywordPerformanceTable({
  factSqp,
  currentPeriod,
  priorPeriod
}: AnlyKeywordPerformanceTableProps) {

  // Compute Keyword Diagnostics on the fly
  const diagnosedRows = useMemo(() => {
    // 1. Get current period SQP records
    const curSqp = factSqp.filter(r => r.period === currentPeriod);
    
    // 2. Sort by Search Volume desc to find top 50
    const sortedCurSqp = [...curSqp].sort((a, b) => b.searchVolume - a.searchVolume);
    const top50 = sortedCurSqp.slice(0, 50);

    // 3. For each keyword, calculate dual period benchmarks
    const rows: AnlyKeywordPerformanceRow[] = top50.map(kw => {
      // Find same keyword in prior period
      const priorKw = factSqp.find(r => r.searchQuery === kw.searchQuery && r.period === priorPeriod);

      const curSearchVolume = kw.searchVolume;
      const priSearchVolume = priorKw ? priorKw.searchVolume : 0;
      const volumeChangeRate = priSearchVolume !== 0 ? (curSearchVolume - priSearchVolume) / priSearchVolume : 0;

      const curPurchaseShare = kw.purchaseShare;
      const priPurchaseShare = priorKw ? priorKw.purchaseShare : 0;
      const shareChange = curPurchaseShare - priPurchaseShare;

      // AI Diagnostic Rule-Engine
      let trafficOpportunity = "✅ 表现良好，保持观察";
      if (kw.brandCtr < kw.marketCtr && kw.brandCvr >= kw.marketCvr) {
        trafficOpportunity = "⚠️ 点击率偏低，检查主图与价格";
      } else if (kw.brandCtr >= kw.marketCtr && kw.brandCvr < kw.marketCvr) {
        trafficOpportunity = "⚠️ 转化率偏低，检查详情页与视频";
      } else if (kw.brandCtr < kw.marketCtr && kw.brandCvr < kw.marketCvr) {
        trafficOpportunity = "🚨 双重不足，评估是否降低出价";
      }

      return {
        searchQuery: kw.searchQuery,
        curSearchVolume,
        priSearchVolume,
        volumeChangeRate,
        curPurchaseShare,
        priPurchaseShare,
        shareChange,
        trafficOpportunity
      };
    });

    return rows;
  }, [factSqp, currentPeriod, priorPeriod]);

  // Absolute maximums for inline data bars
  const maxChangeVals = useMemo(() => {
    return {
      volume: Math.max(...diagnosedRows.map(r => r.curSearchVolume), 1),
      shareChange: Math.max(...diagnosedRows.map(r => Math.abs(r.shareChange)), 0.01),
    };
  }, [diagnosedRows]);

  // Find the top market share threat
  const worstShareLoss = useMemo(() => {
    let worst: AnlyKeywordPerformanceRow | null = null;
    for (const r of diagnosedRows) {
      if (r.shareChange < 0 && (!worst || r.shareChange < worst.shareChange)) {
        worst = r;
      }
    }
    return worst;
  }, [diagnosedRows]);

  return (
    <div className="space-y-6 animate-fade-up" id="anly-keyword-performance">
      {/* Header Info Block */}
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[var(--color-primary)]">
        <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block mb-1">
          分析中心 / 关键词流量诊断
        </span>
        <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
          关键词表现与转化分析
        </h2>
        <p className="text-[12px] text-[var(--color-muted)] mt-1">
          分析当前周期的 <span className="font-semibold text-[var(--color-primary)]">搜索量前 50 的关键词</span> ，分析周期： <span className="font-mono text-slate-800 font-semibold">{currentPeriod}</span>。对比市场基准，查看流量与转化差距。
        </p>
      </div>

      {/* Insight Section */}
      {worstShareLoss && worstShareLoss.shareChange < -0.01 && (
        <div className="insight-block bg-[var(--insight-bg)] p-5 rounded-xl border-l-4 border-[var(--color-accent)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingDown size={24} className="text-[var(--color-negative)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-serif-heading text-base font-bold text-[var(--color-primary)]">
                重点关注购买份额下降：「{worstShareLoss.searchQuery}」
              </h4>
              <p className="text-[12px] text-[var(--color-body-text)] mt-1 leading-relaxed">
                当前关键词分析发现 <span className="font-semibold text-[var(--color-primary)]">"{worstShareLoss.searchQuery}"</span> 的品牌购买份额下降最多，下降 <span className="font-mono text-[var(--color-negative)] font-bold">{formatPercent(Math.abs(worstShareLoss.shareChange))}</span>。规则提示： {worstShareLoss.trafficOpportunity}。
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block">
              购买份额下降
            </span>
            <span className="font-serif-display text-2xl font-black text-[var(--color-negative)]">
              -{formatPercent(Math.abs(worstShareLoss.shareChange))}
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
                <th className="px-4 py-3 font-semibold text-center w-12">序号</th>
                <th className="px-4 py-3 font-semibold">搜索词 / 关键词</th>
                <th className="px-4 py-3 text-right font-semibold">本期搜索量</th>
                <th className="px-4 py-3 text-right font-semibold">上期搜索量</th>
                <th className="px-4 py-3 text-right font-semibold">搜索量变化率</th>
                <th className="px-4 py-3 text-right font-semibold">本期购买份额</th>
                <th className="px-4 py-3 text-right font-semibold">上期购买份额</th>
                <th className="px-4 py-3 text-right font-semibold">份额变化</th>
                <th className="px-4 py-3 font-semibold text-center w-80">流量与商品页面诊断提示</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {diagnosedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                    暂无搜索词表现数据，请先导入搜索词报表。
                  </td>
                </tr>
              ) : (
                diagnosedRows.map((row, idx) => {
                  const volPct = Math.min((row.curSearchVolume / maxChangeVals.volume) * 100, 100);
                  const shareChgPct = Math.min((Math.abs(row.shareChange) / maxChangeVals.shareChange) * 100, 100);

                  const isDoubleDeficit = row.trafficOpportunity.includes("双重不足");
                  const isLowCtr = row.trafficOpportunity.includes("点击率偏低");
                  const isLowCvr = row.trafficOpportunity.includes("转化率偏低");

                  return (
                    <tr
                      key={row.searchQuery}
                      className={`transition-colors ${
                        isDoubleDeficit 
                          ? 'bg-[var(--anomaly-bg)] hover:bg-red-50/70' 
                          : 'even:bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-[var(--color-muted)] font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--color-primary)]">
                        {row.searchQuery}
                      </td>

                      {/* Current Search Volume with Inline Data Bar */}
                      <td className="px-4 py-3 text-right font-mono relative min-w-32">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${volPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.05] rounded-sm"
                          />
                        </div>
                        <span className="relative z-10 text-slate-800">
                          {formatInteger(row.curSearchVolume)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatInteger(row.priSearchVolume)}</td>
                      
                      <td className={`px-4 py-3 text-right font-mono ${row.volumeChangeRate < 0 ? 'text-[var(--color-negative)]' : 'text-slate-600'}`}>
                        {row.volumeChangeRate > 0 ? '+' : ''}{formatPercentOneDecimal(row.volumeChangeRate)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatPercent(row.curPurchaseShare)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPercent(row.priPurchaseShare)}</td>

                      {/* Share Change with Inline Data Bar */}
                      <td className={`px-4 py-3 text-right font-mono relative min-w-28 ${row.shareChange < 0 ? 'text-[var(--color-negative)] font-semibold' : 'text-slate-800'}`}>
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${shareChgPct}%` }} 
                            className={`h-full ${row.shareChange < 0 ? 'bg-[var(--color-negative)]' : 'bg-[var(--color-accent)]'} opacity-[0.05] rounded-sm`}
                          />
                        </div>
                        <span className="relative z-10">
                          {row.shareChange > 0 ? '+' : ''}{formatPercent(row.shareChange)}
                        </span>
                      </td>

                      {/* Diagnostic Recommendation */}
                      <td className="px-4 py-3 text-center">
                        {isDoubleDeficit ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-[var(--color-negative)] animate-pulse border border-red-200">
                            <AlertTriangle size={12} /> 双重不足，评估是否降低出价
                          </span>
                        ) : isLowCtr ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle size={12} /> 点击率偏低，检查主图与价格
                          </span>
                        ) : isLowCvr ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <AlertTriangle size={12} /> 转化率偏低，检查详情页与视频
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle size={12} /> 表现良好，保持观察
                          </span>
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
          当前展示前 {diagnosedRows.length} 个关键词的诊断结果，周期： {currentPeriod}.
        </div>
      </div>
    </div>
  );
}
