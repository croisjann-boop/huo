// 2026-11-08: 简体中文界面适配；保留原作者 Apache-2.0 许可证。
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
      alert("此 SKU 已有映射关系，可直接在下方表格中修改。");
      return;
    }

    const updatedSkuMap = [
      ...config.skuMap,
      {
        sku: newSku.trim(),
        parentAsin: newAsin.trim() || "未填写",
        name: newName.trim() || "未填写",
        productLine: newProductLine.trim() || "未填写",
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
            分析周期设置
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase mb-1">
                分析频率
              </label>
              <select
                value={config.analysisType}
                onChange={handleTypeChange}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[13px] text-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-medium"
              >
                <option value="Weekly">按周分析（周环比）</option>
                <option value="Monthly">按月分析（月环比）</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase mb-1">
                当前分析周期
              </label>
              <input
                type="text"
                value={config.currentPeriod}
                onChange={handlePeriodChange}
                placeholder={config.analysisType === 'Weekly' ? "例如：2026-W27" : "例如：2026-06"}
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-[13px] text-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono font-medium"
              />
              <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                格式： {config.analysisType === 'Weekly' ? "年-W周数，例如 2026-W27" : "年-月份，例如 2026-06"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Prior Period Read-Only */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-serif-heading text-lg font-semibold text-[var(--color-primary)] mb-1">
              对比周期
            </h3>
            <p className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase mb-4">
              上一周期（自动计算）
            </p>
          </div>
          <div className="mb-4">
            <span className="font-serif-display text-4xl font-bold text-[var(--color-accent)] tracking-tight">
              {config.priorPeriod || "未填写"}
            </span>
            <div className="text-[12px] text-[var(--color-muted)] mt-2">
              自动选择紧邻当前周期之前的一个周期，当前周期为 {config.currentPeriod}.
            </div>
          </div>
        </div>

        {/* Formula Explanatory Box */}
        <div className="bg-[var(--insight-bg)] p-6 rounded-xl shadow-md border-l-4 border-[var(--color-accent)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)] font-semibold">
              <HelpCircle size={16} className="text-[var(--color-accent)]" />
              <span className="font-serif-heading text-base font-semibold">自动计算规则</span>
            </div>
            <p className="text-[12px] text-[var(--color-body-text)] leading-relaxed">
              在浏览器中根据分析频率自动计算上一周期：
            </p>
            <div className="bg-white/60 p-2 rounded-md font-mono text-[10px] text-[var(--color-primary)] mt-3 overflow-x-auto">
              按周分析取上一周；按月分析取上一个月。
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted)] mt-3">
            修改基础配置后，相关报表和分析结果会自动重新计算。
          </p>
        </div>
      </div>

      {/* SKU Map Panel */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--color-border)] pb-4">
          <div>
            <h2 className="font-serif-heading text-xl font-bold text-[var(--color-primary)]">
              SKU、父 ASIN 与产品线映射
            </h2>
            <p className="text-[12px] text-[var(--color-muted)]">
              将商家 SKU 关联至父 ASIN、商品名称和产品线，用于跨报表匹配。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="搜索 SKU、父 ASIN、商品或产品线…"
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
              商家 SKU *
            </label>
            <input
              type="text"
              required
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              placeholder="例如：ARES-PRO-BLK"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              父 ASIN
            </label>
            <input
              type="text"
              value={newAsin}
              onChange={(e) => setNewAsin(e.target.value)}
              placeholder="例如：B0D12345AB"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              商品中文名称
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：黑色人体工学椅"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--color-primary)] uppercase tracking-wider mb-1">
              产品线
            </label>
            <input
              type="text"
              value={newProductLine}
              onChange={(e) => setNewProductLine(e.target.value)}
              placeholder="例如：人体工学椅"
              className="w-full bg-white border border-[var(--color-border)] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-primary)]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white text-[13px] font-medium py-1.5 px-3 rounded-md hover:bg-opacity-90 active:scale-97 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> 添加映射
          </button>
        </form>

        {/* Map Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold">商家 SKU（可编辑）</th>
                <th className="px-4 py-3 font-semibold">父 ASIN（关联目标）</th>
                <th className="px-4 py-3 font-semibold">商品名称</th>
                <th className="px-4 py-3 font-semibold">产品线分类</th>
                <th className="px-4 py-3 font-semibold text-center w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {filteredSkuMap.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-muted)] font-serif-heading italic">
                    暂无映射关系，请先在上方添加 SKU。
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
                        title="删除映射"
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
          当前显示第 {filteredSkuMap.length} 条，共 {config.skuMap.length} 条 SKU 映射。
        </div>
      </div>
    </div>
  );
}
