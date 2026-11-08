// 2026-11-08: 简体中文界面适配；保留原作者 Apache-2.0 许可证。
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FactSQPRow } from '../types';
import { formatInteger, formatPercent } from '../utils';
import { Search, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface FactSQPTableProps {
  data: FactSQPRow[];
}

export default function FactSQPTable({ data }: FactSQPTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const s = searchQuery.toLowerCase();
    return data.filter(row => 
      row.searchQuery.toLowerCase().includes(s) ||
      row.period.toLowerCase().includes(s)
    );
  }, [data, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredData, currentPage]);

  // Max values for horizontal data bars
  const maxVals = useMemo(() => {
    return {
      volume: Math.max(...data.map(r => r.searchVolume), 1),
      brandClicks: Math.max(...data.map(r => r.brandClicks), 1),
      marketClicks: Math.max(...data.map(r => r.marketClicks), 1),
    };
  }, [data]);

  // Totals for filter count
  const totals = useMemo(() => {
    return {
      volume: filteredData.reduce((sum, r) => sum + r.searchVolume, 0),
      brandClicks: filteredData.reduce((sum, r) => sum + r.brandClicks, 0),
      marketClicks: filteredData.reduce((sum, r) => sum + r.marketClicks, 0),
    };
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-fade-up" id="fact-sqp-table">
      {/* Header Info Block */}
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[var(--color-accent)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block mb-1">
            标准数据层
          </span>
          <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
            搜索词标准汇总表
          </h2>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            标准化搜索词报表，比较品牌与市场的点击率、转化率及购买份额。
          </p>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="搜索关键词或统计周期…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-8 pr-3 py-1.5 border border-[var(--color-border)] rounded-md text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-60"
          />
        </div>
      </div>

      {/* Explanatory banner */}
      <div className="bg-[var(--insight-bg)] p-4 rounded-xl border-l-4 border-[var(--color-accent)] flex items-start gap-3">
        <HelpCircle size={18} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
        <div className="text-[12px] text-[var(--color-body-text)]">
          <p className="font-bold font-serif-heading text-sm text-[var(--color-primary)] mb-1">了解点击率差值（品牌与市场对比）</p>
          <p className="leading-relaxed">
            点击率差值 = <span className="font-mono">品牌点击率 − 市场点击率</span>。正值表示品牌点击率高于市场基准；当差值较低（例如 <span className="font-semibold text-[var(--color-negative)]">低于 −1.50 个百分点</span>）时触发规则提醒，可进一步核查主图、价格等因素。
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-12">序号</th>
                <th className="px-4 py-3 font-semibold">周期</th>
                <th className="px-4 py-3 font-semibold">搜索词 / 关键词</th>
                <th className="px-4 py-3 font-semibold text-right">搜索量</th>
                <th className="px-4 py-3 font-semibold text-right">品牌点击量</th>
                <th className="px-4 py-3 font-semibold text-right">市场点击量</th>
                <th className="px-4 py-3 font-semibold text-right">品牌点击率</th>
                <th className="px-4 py-3 font-semibold text-right">市场点击率</th>
                <th className="px-4 py-3 font-semibold text-right">品牌转化率</th>
                <th className="px-4 py-3 font-semibold text-right">市场转化率</th>
                <th className="px-4 py-3 font-semibold text-right">购买份额</th>
                <th className="px-4 py-3 font-semibold text-right">点击率差值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                    暂无匹配的搜索词汇总记录，请检查原始搜索词数据。
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  const volPct = Math.min((row.searchVolume / maxVals.volume) * 100, 100);
                  const bcPct = Math.min((row.brandClicks / maxVals.brandClicks) * 100, 100);
                  const mcPct = Math.min((row.marketClicks / maxVals.marketClicks) * 100, 100);

                  // Anomaly rule: CTR Gap is severely negative (less than -1.50%)
                  const isAnomaly = row.ctrGap < -0.015;

                  return (
                    <tr
                      key={globalIdx}
                      className={`transition-colors ${
                        isAnomaly 
                          ? 'bg-[var(--anomaly-bg)] hover:bg-red-50/70' 
                          : 'even:bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-[var(--color-muted)] font-mono text-[11px]">
                        {globalIdx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {row.period}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--color-primary)]">
                        {row.searchQuery}
                      </td>

                      {/* Search Volume Column + Inline Bar */}
                      <td className="px-4 py-3 text-right font-mono relative min-w-28">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${volPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.06] rounded-sm"
                          />
                        </div>
                        <span className="relative z-10 text-slate-700">
                          {formatInteger(row.searchVolume)}
                        </span>
                      </td>

                      {/* Brand Clicks Column + Inline Bar */}
                      <td className="px-4 py-3 text-right font-mono relative min-w-24">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${bcPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.06] rounded-sm"
                          />
                        </div>
                        <span className="relative z-10 font-medium text-[var(--color-primary)]">
                          {formatInteger(row.brandClicks)}
                        </span>
                      </td>

                      {/* Market Clicks Column + Inline Bar */}
                      <td className="px-4 py-3 text-right font-mono relative min-w-28">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${mcPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.06] rounded-sm"
                          />
                        </div>
                        <span className="relative z-10 text-slate-600">
                          {formatInteger(row.marketClicks)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatPercent(row.brandCtr)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPercent(row.marketCtr)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatPercent(row.brandCvr)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{formatPercent(row.marketCvr)}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[var(--color-primary)]">{formatPercent(row.purchaseShare)}</td>

                      {/* CTR Gap Column */}
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        row.ctrGap < 0 
                          ? isAnomaly 
                            ? 'text-[var(--color-negative)]' 
                            : 'text-slate-600'
                          : 'text-slate-700'
                      }`}>
                        {row.ctrGap > 0 ? '+' : ''}{formatPercent(row.ctrGap)}
                        {isAnomaly && (
                          <span className="ml-1 text-[10px] bg-red-100 text-[var(--color-negative)] px-1 rounded-full align-middle font-bold uppercase tracking-wider">
                            异常提醒
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* SUM Row */}
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-[var(--color-border)] text-[12px] font-semibold text-[var(--color-primary)] font-sans">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-center uppercase tracking-wider font-semibold">合计</td>
                  <td className="px-4 py-3 text-right font-mono">{formatInteger(totals.volume)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatInteger(totals.brandClicks)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatInteger(totals.marketClicks)}</td>
                  <td colSpan={6}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 border-t border-[var(--color-border)] pt-4">
            <span className="text-[12px] text-[var(--color-muted)]">
              当前显示第 <span className="font-semibold text-[var(--color-primary)]">{(currentPage - 1) * itemsPerPage + 1}</span> 至{' '}
              <span className="font-semibold text-[var(--color-primary)]">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> 条，共{' '}
              <span className="font-semibold text-[var(--color-primary)]">{filteredData.length}</span> 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-[var(--color-border)] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const isCurrent = page === currentPage;
                if (totalPages > 6 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-[12px] font-semibold rounded transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border border-transparent hover:border-[var(--color-border)] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-[var(--color-border)] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
