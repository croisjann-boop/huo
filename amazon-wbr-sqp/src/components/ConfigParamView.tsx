/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConfigParam, SKUMapRow } from '../types';
import { calculatePriorPeriod } from '../utils';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

interface ConfigParamViewProps {
  config: ConfigParam;
  onUpdateConfig: (newConfig: ConfigParam) => void;
}

export default function ConfigParamView({ config, onUpdateConfig }: ConfigParamViewProps) {
  const [newSku, setNewSku] = useState('');
  const [newAsin, setNewAsin] = useState('');
  const [newName, setNewName] = useState('');
  const [newProductLine, setNewProductLine] = useState('');

  const [skuSearch, setSkuSearch] = useState('');

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'Weekly' | 'Monthly';
    const currentPeriod = type === 'Weekly' ? '2026-W27' : '2026-06';
    const priorPeriod = calculatePriorPeriod(currentPeriod, type);
    onUpdateConfig({
      ...config,
      analysisType: type,
      currentPeriod,
      priorPeriod,
    });
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentPeriod = e.target.value;
    const priorPeriod = calculatePriorPeriod(currentPeriod, config.analysisType);
    onUpdateConfig({
      ...config,
      currentPeriod,
      priorPeriod,
    });
  };

  const handleAddSkuMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim()) return;
    
    // Check if duplicate
    if (config.skuMap.some(row => row.sku.toLowerCase() === newSku.trim().toLowerCase())) {
      alert('This SKU is already mapped. You can edit it directly in the table below.');
      return;
    }

    const updatedSkuMap = [
      ...config.skuMap,
      {
        sku: newSku.trim(),
        parentAsin: newAsin.trim() || 'N/A',
        name: newName.trim() || 'N/A',
        productLine: newProductLine.trim() || 'N/A',
      }
    ];

    onUpdateConfig({
      ...config,
      skuMap: updatedSkuMap,
    });

    setNewSku('');
    setNewAsin('');
    setNewName('');
    setNewProductLine('');
  };

  const handleDeleteSkuMap = (sku: string) => {
    const updatedSkuMap = config.skuMap.filter(row => row.sku !== sku);
    onUpdateConfig({
      ...config,
      skuMap: updatedSkuMap,
    });
  };

  const handleEditCell = (index: number, field: keyof SKUMapRow, value: string) => {
    const updatedSkuMap = [...config.skuMap];
    updatedSkuMap[index] = {
      ...updatedSkuMap[index],
      [field]: value,
    };
    onUpdateConfig({
      ...config,
      skuMap: updatedSkuMap,
    });
  };

  const filteredSkuMap = config.skuMap.filter(item => 
    item.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
    item.parentAsin.toLowerCase().includes(skuSearch.toLowerCase()) ||
    item.name.toLowerCase().includes(skuSearch.toLowerCase()) ||
    item.productLine.toLowerCase().includes(skuSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-up" id="config-param-view">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Settings Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border-b-2 border-[var(--color-primary)]">
          <h3 className="font-serif-heading text-lg font-semibold text-[var(--color-primary)] mb-4">
            Analysis Period Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase mb-1">
                Analysis Dimension (Analysis_Type)
              </label>
              <select
                value={config.analysisType}
                onChange={handleTypeChange}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[13px] text-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-medium"
              >
                <option value="Weekly">Weekly (WOW Analysis)</option>
                <option value="Monthly">Monthly (MOM Analysis)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase mb-1">
                Target Period (Current_Period)
              </label>
              <input
                type="text"
                value={config.currentPeriod}
                onChange={handlePeriodChange}
                placeholder={config.analysisType === 'Weekly' ? 'e.g. 2026-W27' : 'e.g. 2026-06'}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[13px] text-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono font-medium"
              />
              <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                Format: {config.analysisType === 'Weekly' ? 'YYYY-Wxx (e.g. 2026-W27)' : 'YYYY-MM (e.g. 2026-06)'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Prior Period Read-Only */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-serif-heading text-lg font-semibold text-[var(--color-primary)] mb-1">
              Comparison Period
            </h3>
            <p className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase mb-4">
              Prior_Period (Computed automatically)
            </p>
          </div>
          <div className="mb-4">
            <span className="font-serif-display text-4xl font-bold text-[var(--color-accent)] tracking-tight">
              {config.priorPeriod || 'N/A'}
            </span>
            <div className="text-[12px] text-[var(--color-muted)] mt-2">
              Based on formulas automatically resolving to the period immediately preceding {config.currentPeriod}.
            </div>
          </div>
        </div>

        {/* Formula Explanatory Box */}
        <div className="bg-[var(--insight-bg)] p-6 rounded-xl shadow-md border-l-4 border-[var(--color-accent)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)] font-semibold">
              <HelpCircle size={16} className="text-[var(--color-accent)]" />
              <span className="font-serif-heading text-base font-semibold">Zero-Maintenance Engine Rules</span>
            </div>
            <p className="text-[12px] text-[var(--color-body-text)] leading-relaxed">
              Prior period is resolved client-side mirroring Excel's dynamic array logic:
            </p>
            <div className="bg-white/60 p-2 rounded-md font-mono text-[10px] text-[var(--color-primary)] mt-3 overflow-x-auto">
              =LET(type, B1, curr, B2, IF(type="Weekly", ...))
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-3">
            Change base configurations to instantly trigger complete downstream re-calculations.
          </p>
        </div>
      </div>

      {/* SKU Map Panel */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--color-border)] pb-4">
          <div>
            <h2 className="font-serif-heading text-xl font-bold text-[var(--color-primary)]">
              SKU to Parent ASIN / Product Line Map
            </h2>
            <p className="text-[12px] text-[var(--color-muted)]">
              Maps merchant-specific SKUs (MSKUs) to Parent ASINs, human-friendly names, and catalogs. Used for database-wide joins.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search map..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="px-3 py-1.5 border border-[var(--color-border)] rounded-md text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Add SKU Mapping Form */}
        <form onSubmit={handleAddSkuMap} className="bg-[var(--color-bg)] p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              Merchant SKU *
            </label>
            <input
              type="text"
              required
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              placeholder="e.g. ARES-PRO-BLK"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              Parent ASIN
            </label>
            <input
              type="text"
              value={newAsin}
              onChange={(e) => setNewAsin(e.target.value)}
              placeholder="e.g. B0D12345AB"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              Chinese / Product Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ares Pro Chair Black"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              Product Line
            </label>
            <input
              type="text"
              value={newProductLine}
              onChange={(e) => setNewProductLine(e.target.value)}
              placeholder="e.g. Ergonomic Chairs"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white text-[13px] font-medium py-1.5 px-3 rounded-md hover:bg-opacity-90 active:scale-97 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> Add Map
          </button>
        </form>

        {/* Map Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">Merchant SKU (Editable)</th>
                <th className="px-4 py-3 font-semibold">Parent ASIN (XLOOKUP Target)</th>
                <th className="px-4 py-3 font-semibold">Product Name Label</th>
                <th className="px-4 py-3 font-semibold">Product Line Category</th>
                <th className="px-4 py-3 font-semibold text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {filteredSkuMap.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-muted)] font-serif-heading italic">
                    No mappings found. Add your SKUs above to join reports cleanly.
                  </td>
                </tr>
              ) : (
                filteredSkuMap.map((row, idx) => (
                  <tr key={row.sku} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 font-mono font-medium text-[var(--color-primary)]">
                      {row.sku}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.parentAsin}
                        onChange={(e) => handleEditCell(config.skuMap.findIndex(item => item.sku === row.sku), 'parentAsin', e.target.value)}
                        className="w-full bg-[var(--color-input-bg)] border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-white rounded px-2 py-1 font-mono text-[13px] outline-none transition-all"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleEditCell(config.skuMap.findIndex(item => item.sku === row.sku), 'name', e.target.value)}
                        className="w-full bg-[var(--color-input-bg)] border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-white rounded px-2 py-1 text-[13px] outline-none transition-all"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.productLine}
                        onChange={(e) => handleEditCell(config.skuMap.findIndex(item => item.sku === row.sku), 'productLine', e.target.value)}
                        className="w-full bg-[var(--color-input-bg)] border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-white rounded px-2 py-1 text-[13px] outline-none transition-all"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteSkuMap(row.sku)}
                        className="text-slate-400 hover:text-[var(--color-negative)] p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete mapping"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-[var(--color-muted)] mt-3">
          Showing {filteredSkuMap.length} of {config.skuMap.length} SKU mappings.
        </div>
      </div>
    </div>
  );
}
