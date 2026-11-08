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
            Standard Fact Layer
          </span>
          <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
            Fact_SQP Search Query standardized facts
          </h2>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            Standardized SQP report. Evaluates individual keywords, calculating Brand vs. Market CTR &amp; CVR gap indexes.
          </p>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search keywords..."
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
          <p className="font-bold font-serif-heading text-sm text-[var(--color-primary)] mb-1">Understanding CTR Gap (Brand vs. Market Appeal)</p>
          <p className="leading-relaxed">
            CTR Gap is calculated as <span className="font-mono">Brand_CTR - Market_CTR</span>. A positive gap indicates superior listing appeal (main images, pricing, star ratings).
            A severe negative CTR Gap (e.g., <span className="font-semibold text-[var(--color-negative)]">&lt; -1.50%</span>) triggers an anomaly warning, signalling listing traffic leaks.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-12">No</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">Search Query (Keyword)</th>
                <th className="px-4 py-3 font-semibold text-right">Search Volume</th>
                <th className="px-4 py-3 font-semibold text-right">Brand Clicks</th>
                <th className="px-4 py-3 font-semibold text-right">Market Clicks</th>
                <th className="px-4 py-3 font-semibold text-right">Brand CTR</th>
                <th className="px-4 py-3 font-semibold text-right">Market CTR</th>
                <th className="px-4 py-3 font-semibold text-right">Brand CVR</th>
                <th className="px-4 py-3 font-semibold text-right">Market CVR</th>
                <th className="px-4 py-3 font-semibold text-right">Purchase Share</th>
                <th className="px-4 py-3 font-semibold text-right">CTR Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                    No matching standardized SQP records found. Ensure raw SQP reports are populated.
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
                            Anomaly
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
                  <td colSpan={3} className="px-4 py-3 text-center uppercase tracking-wider font-semibold">SUM</td>
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
              Showing <span className="font-semibold text-[var(--color-primary)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-[var(--color-primary)]">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
              <span className="font-semibold text-[var(--color-primary)]">{filteredData.length}</span> rows
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
