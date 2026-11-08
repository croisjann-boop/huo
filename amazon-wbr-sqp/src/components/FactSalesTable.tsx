/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FactSalesRow } from '../types';
import { formatCurrency, formatInteger } from '../utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface FactSalesTableProps {
  data: FactSalesRow[];
}

export default function FactSalesTable({ data }: FactSalesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const s = searchQuery.toLowerCase();
    return data.filter(row => 
      row.sku.toLowerCase().includes(s) ||
      row.parentAsin.toLowerCase().includes(s) ||
      row.date.includes(s) ||
      row.periodTag.toLowerCase().includes(s)
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
      revenue: Math.max(...data.map(r => r.salesRevenue), 1),
      units: Math.max(...data.map(r => r.unitsOrdered), 1),
      ppc: Math.max(...data.map(r => r.ppcSpend), 1),
      profit: Math.max(...data.map(r => Math.abs(r.netProfit)), 1),
    };
  }, [data]);

  // Totals
  const totals = useMemo(() => {
    return {
      revenue: filteredData.reduce((sum, r) => sum + r.salesRevenue, 0),
      units: filteredData.reduce((sum, r) => sum + r.unitsOrdered, 0),
      ppc: filteredData.reduce((sum, r) => sum + r.ppcSpend, 0),
      profit: filteredData.reduce((sum, r) => sum + r.netProfit, 0)
    };
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-fade-up" id="fact-sales-table">
      {/* Header Info Block */}
      <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[var(--color-accent)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block mb-1">
            Canonical Fact Layer
          </span>
          <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
            Fact_Sales Standard Sales Wide Table
          </h2>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            Standardized ledger automatically merging Seller Central and Sellerboard reports. Sorts and indexes trade days on SKU level.
          </p>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search fact ledger..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-8 pr-3 py-1.5 border border-[var(--color-border)] rounded-md text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-60"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-12">No</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Merchant SKU</th>
                <th className="px-4 py-3 font-semibold">Parent ASIN</th>
                <th className="px-4 py-3 font-semibold text-right">Sales Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">Units</th>
                <th className="px-4 py-3 font-semibold text-right">PPC Spend</th>
                <th className="px-4 py-3 font-semibold text-right">Net Profit</th>
                <th className="px-4 py-3 font-semibold text-center">Period Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                    No matching aligned ledger records found. Populate Raw reports to build this table.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  const revPct = Math.min((row.salesRevenue / maxVals.revenue) * 100, 100);
                  const unitsPct = Math.min((row.unitsOrdered / maxVals.units) * 100, 100);
                  const ppcPct = Math.min((row.ppcSpend / maxVals.ppc) * 100, 100);
                  const profitPct = Math.min((Math.abs(row.netProfit) / maxVals.profit) * 100, 100);

                  // Set row highlight if unmapped or negative profit
                  const isUnmapped = row.parentAsin === '未映射' || row.parentAsin === 'Unmapped';
                  const isLoss = row.netProfit < 0;

                  return (
                    <tr
                      key={globalIdx}
                      className={`transition-colors ${
                        isUnmapped 
                          ? 'bg-[var(--anomaly-bg)] hover:bg-red-50/70' 
                          : 'even:bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center text-[var(--color-muted)] font-mono text-[11px]">
                        {globalIdx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        {row.date}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium text-[var(--color-primary)]">
                        {row.sku}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                          isUnmapped 
                            ? 'bg-red-100 text-[var(--color-negative)] font-bold' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.parentAsin}
                        </span>
                      </td>

                      {/* Revenue Column + Inline Bar */}
                      <td className="px-4 py-3.5 text-right font-mono relative min-w-32">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${revPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.06] rounded-sm transition-all"
                          />
                        </div>
                        <span className="relative z-10 font-medium text-[var(--color-primary)]">
                          {formatCurrency(row.salesRevenue)}
                        </span>
                      </td>

                      {/* Units Column + Inline Bar */}
                      <td className="px-4 py-3.5 text-right font-mono relative min-w-24">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${unitsPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.06] rounded-sm transition-all"
                          />
                        </div>
                        <span className="relative z-10 text-slate-700">
                          {formatInteger(row.unitsOrdered)}
                        </span>
                      </td>

                      {/* PPC Spend Column + Inline Bar */}
                      <td className="px-4 py-3.5 text-right font-mono relative min-w-28">
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${ppcPct}%` }} 
                            className="h-full bg-[var(--color-accent)] opacity-[0.06] rounded-sm transition-all"
                          />
                        </div>
                        <span className="relative z-10 text-slate-700">
                          {formatCurrency(row.ppcSpend)}
                        </span>
                      </td>

                      {/* Net Profit Column + Inline Bar */}
                      <td className={`px-4 py-3.5 text-right font-mono relative min-w-32 ${isLoss ? 'text-[var(--color-negative)] font-semibold' : ''}`}>
                        <div className="absolute right-4 bottom-1 top-1 left-4 pointer-events-none flex items-center justify-end">
                          <div 
                            style={{ width: `${profitPct}%` }} 
                            className={`h-full ${isLoss ? 'bg-[var(--color-negative)]' : 'bg-[var(--color-accent)]'} opacity-[0.06] rounded-sm transition-all`}
                          />
                        </div>
                        <span className="relative z-10">
                          {formatCurrency(row.netProfit)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-600">
                        {row.periodTag}
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
                  <td colSpan={4} className="px-4 py-3 text-center uppercase tracking-wider font-semibold">SUM</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.revenue)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatInteger(totals.units)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.ppc)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${totals.profit < 0 ? 'text-[var(--color-negative)] font-bold' : ''}`}>
                    {formatCurrency(totals.profit)}
                  </td>
                  <td></td>
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
