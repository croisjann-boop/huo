/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { RawSellerCentralRow, RawSellerboardRow, RawSQPRow } from '../types';
import { parseCSV, formatCurrency, formatInteger, formatPercent } from '../utils';
import { Upload, Clipboard, Check, Trash2, Plus, AlertCircle, Sparkles, ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';

interface RawTableEditorProps {
  type: 'sellerCentral' | 'sellerboard' | 'sqp';
  sellerCentralData: RawSellerCentralRow[];
  sellerboardData: RawSellerboardRow[];
  sqpData: RawSQPRow[];
  onUpdateSellerCentral: (data: RawSellerCentralRow[]) => void;
  onUpdateSellerboard: (data: RawSellerboardRow[]) => void;
  onUpdateSQP: (data: RawSQPRow[]) => void;
}

export default function RawTableEditor({
  type,
  sellerCentralData,
  sellerboardData,
  sqpData,
  onUpdateSellerCentral,
  onUpdateSellerboard,
  onUpdateSQP
}: RawTableEditorProps) {
  // Navigation & view states
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [importFeedback, setImportFeedback] = useState<{ status: 'success' | 'error' | null; message: string }>({ status: null, message: '' });
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 50;

  // Metadata per type
  const meta = useMemo(() => {
    switch (type) {
      case 'sellerCentral':
        return {
          title: 'Raw Seller Central Data',
          subtitle: 'Traffic and Sales Report (Business Report: Date + SKU)',
          fields: [
            { key: 'date', label: 'Date', type: 'date', placeholder: 'YYYY-MM-DD' },
            { key: 'sku', label: 'Merchant SKU', type: 'text', placeholder: 'e.g. ARES-PRO-BLK' },
            { key: 'unitsOrdered', label: 'Units Ordered', type: 'number', placeholder: '0' },
            { key: 'orderedProductSales', label: 'Sales Revenue ($)', type: 'number', placeholder: '0.00' },
            { key: 'pageViews', label: 'Page Views', type: 'number', placeholder: '0' },
            { key: 'sessions', label: 'Sessions', type: 'number', placeholder: '0' }
          ],
          data: sellerCentralData,
          updater: onUpdateSellerCentral,
          defaultRow: { date: new Date().toISOString().split('T')[0], sku: '', unitsOrdered: 0, orderedProductSales: 0, pageViews: 0, sessions: 0 } as RawSellerCentralRow
        };
      case 'sellerboard':
        return {
          title: 'Raw Sellerboard Profit Data',
          subtitle: 'Financial & Profit Report (Sellerboard Profit: Date + SKU)',
          fields: [
            { key: 'date', label: 'Date', type: 'date', placeholder: 'YYYY-MM-DD' },
            { key: 'sku', label: 'Merchant SKU', type: 'text', placeholder: 'e.g. ARES-PRO-BLK' },
            { key: 'sales', label: 'Sales Revenue ($)', type: 'number', placeholder: '0.00' },
            { key: 'units', label: 'Units', type: 'number', placeholder: '0' },
            { key: 'ppcSpend', label: 'PPC Spend ($)', type: 'number', placeholder: '0.00' },
            { key: 'fees', label: 'Fees ($)', type: 'number', placeholder: '0.00' },
            { key: 'cogs', label: 'COGS ($)', type: 'number', placeholder: '0.00' },
            { key: 'netProfit', label: 'Net Profit ($)', type: 'number', placeholder: '0.00' }
          ],
          data: sellerboardData,
          updater: onUpdateSellerboard,
          defaultRow: { date: new Date().toISOString().split('T')[0], sku: '', sales: 0, units: 0, ppcSpend: 0, fees: 0, cogs: 0, netProfit: 0 } as RawSellerboardRow
        };
      case 'sqp':
        return {
          title: 'Raw Search Query Performance (SQP) Data',
          subtitle: 'Amazon SQP Search Funnel Performance Report (Reporting Period + Keyword)',
          fields: [
            { key: 'period', label: 'Reporting Period', type: 'text', placeholder: 'e.g. 2026-W27' },
            { key: 'searchQuery', label: 'Search Query', type: 'text', placeholder: 'e.g. ergonomic office chair' },
            { key: 'searchVolume', label: 'Search Volume', type: 'number', placeholder: '0' },
            { key: 'brandClicks', label: 'Brand Clicks', type: 'number', placeholder: '0' },
            { key: 'marketClicks', label: 'Market Clicks', type: 'number', placeholder: '0' },
            { key: 'brandCtr', label: 'Brand CTR', type: 'percent', placeholder: 'e.g. 5.5%' },
            { key: 'marketCtr', label: 'Market CTR', type: 'percent', placeholder: 'e.g. 4.0%' },
            { key: 'brandCvr', label: 'Brand CVR', type: 'percent', placeholder: 'e.g. 4.5%' },
            { key: 'marketCvr', label: 'Market CVR', type: 'percent', placeholder: 'e.g. 3.6%' },
            { key: 'purchaseShare', label: 'Purchase Share', type: 'percent', placeholder: 'e.g. 14%' }
          ],
          data: sqpData,
          updater: onUpdateSQP,
          defaultRow: { period: '2026-W27', searchQuery: '', searchVolume: 0, brandClicks: 0, marketClicks: 0, brandCtr: 0, marketCtr: 0, brandCvr: 0, marketCvr: 0, purchaseShare: 0 } as RawSQPRow
        };
    }
  }, [type, sellerCentralData, sellerboardData, sqpData, onUpdateSellerCentral, onUpdateSellerboard, onUpdateSQP]);

  // Bulk parser using smart headers matching
  const handleBulkImport = (rawText: string) => {
    try {
      if (!rawText.trim()) {
        setImportFeedback({ status: 'error', message: 'Input is empty. Please copy and paste valid CSV/TSV.' });
        return;
      }
      
      const parsedRows = parseCSV(rawText);
      if (parsedRows.length < 2) {
        setImportFeedback({ status: 'error', message: 'No valid data rows found. Ensure you have a header row and data rows.' });
        return;
      }

      const headers = parsedRows[0].map(h => h.toLowerCase().trim());
      const dataRows = parsedRows.slice(1);

      // Helper function to resolve index
      const getIndex = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(kw => h.includes(kw)));
      };

      let importedCount = 0;

      if (type === 'sellerCentral') {
        const dateIdx = getIndex(['date', '日期', 'day']);
        const skuIdx = getIndex(['sku', 'msku', 'merchant-sku', 'merchant_sku', '商品']);
        const unitsIdx = getIndex(['units', 'ordered', 'unitsordered', 'units ordered', '订单件数', '件数']);
        const salesIdx = getIndex(['sales', 'revenue', 'orderedproductsales', 'sales revenue', '销售额']);
        const viewsIdx = getIndex(['page', 'view', 'pageviews', 'page views', '页面浏览次数']);
        const sessionsIdx = getIndex(['session', 'sessions', '买家访问次数']);

        if (dateIdx === -1 || skuIdx === -1) {
          throw new Error('Could not identify "Date" or "SKU" columns in header.');
        }

        const formatted = dataRows.map((row) => {
          const uStr = unitsIdx !== -1 && row[unitsIdx] ? row[unitsIdx].replace(/[^0-9.-]/g, '') : '0';
          const sStr = salesIdx !== -1 && row[salesIdx] ? row[salesIdx].replace(/[^0-9.-]/g, '') : '0';
          const vStr = viewsIdx !== -1 && row[viewsIdx] ? row[viewsIdx].replace(/[^0-9.-]/g, '') : '0';
          const seStr = sessionsIdx !== -1 && row[sessionsIdx] ? row[sessionsIdx].replace(/[^0-9.-]/g, '') : '0';
          return {
            date: row[dateIdx] || '',
            sku: row[skuIdx] || '',
            unitsOrdered: Math.round(parseFloat(uStr) || 0),
            orderedProductSales: parseFloat(sStr) || 0,
            pageViews: Math.round(parseFloat(vStr) || 0),
            sessions: Math.round(parseFloat(seStr) || 0),
          };
        }).filter(r => r.date && r.sku) as RawSellerCentralRow[];

        meta.updater(formatted);
        importedCount = formatted.length;

      } else if (type === 'sellerboard') {
        const dateIdx = getIndex(['date', '日期', 'day']);
        const skuIdx = getIndex(['sku', 'msku', 'merchant-sku', 'merchant_sku', '商品']);
        const salesIdx = getIndex(['sales', 'revenue', 'sales revenue', '销售额']);
        const unitsIdx = getIndex(['units', 'ordered', '数量', '销售件数']);
        const ppcIdx = getIndex(['ppc', 'ppcspend', 'spend', 'advertising', '广告花费']);
        const feesIdx = getIndex(['fee', 'fees', 'amazon fee', '佣金', '费用']);
        const cogsIdx = getIndex(['cogs', 'cost', 'product cost', '采购成本', '成本']);
        const profitIdx = getIndex(['profit', 'netprofit', 'net profit', '净利润', '利润']);

        if (dateIdx === -1 || skuIdx === -1) {
          throw new Error('Could not identify "Date" or "SKU" columns in header.');
        }

        const formatted = dataRows.map((row) => {
          const saStr = salesIdx !== -1 && row[salesIdx] ? row[salesIdx].replace(/[^0-9.-]/g, '') : '0';
          const uStr = unitsIdx !== -1 && row[unitsIdx] ? row[unitsIdx].replace(/[^0-9.-]/g, '') : '0';
          const ppStr = ppcIdx !== -1 && row[ppcIdx] ? row[ppcIdx].replace(/[^0-9.-]/g, '') : '0';
          const fStr = feesIdx !== -1 && row[feesIdx] ? row[feesIdx].replace(/[^0-9.-]/g, '') : '0';
          const cStr = cogsIdx !== -1 && row[cogsIdx] ? row[cogsIdx].replace(/[^0-9.-]/g, '') : '0';
          const prStr = profitIdx !== -1 && row[profitIdx] ? row[profitIdx].replace(/[^0-9.-]/g, '') : '0';

          return {
            date: row[dateIdx] || '',
            sku: row[skuIdx] || '',
            sales: parseFloat(saStr) || 0,
            units: Math.round(parseFloat(uStr) || 0),
            ppcSpend: parseFloat(ppStr) || 0,
            fees: parseFloat(fStr) || 0,
            cogs: parseFloat(cStr) || 0,
            netProfit: parseFloat(prStr) || 0,
          };
        }).filter(r => r.date && r.sku) as RawSellerboardRow[];

        meta.updater(formatted);
        importedCount = formatted.length;

      } else if (type === 'sqp') {
        const periodIdx = getIndex(['period', 'time', 'reporting period', '汇报周期', '期间']);
        const queryIdx = getIndex(['query', 'search query', 'keyword', '搜索词', '关键词']);
        const volumeIdx = getIndex(['volume', 'search volume', '搜索量', '热度']);
        const brandClicksIdx = getIndex(['brand clicks', 'brand_clicks', '品牌点击数']);
        const marketClicksIdx = getIndex(['market clicks', 'market_clicks', '大盘点击数']);
        const brandCtrIdx = getIndex(['brand ctr', 'brand_ctr', '品牌点击率']);
        const marketCtrIdx = getIndex(['market ctr', 'market_ctr', '大盘点击率']);
        const brandCvrIdx = getIndex(['brand cvr', 'brand_cvr', '品牌转化率', '品牌购买率']);
        const marketCvrIdx = getIndex(['market cvr', 'market_cvr', '大盘转化率', '大盘购买率']);
        const shareIdx = getIndex(['share', 'purchase share', 'purchase_share', '购买份额']);

        if (periodIdx === -1 || queryIdx === -1) {
          throw new Error('Could not identify "Reporting Period" or "Search Query/Keyword" columns in header.');
        }

        const parsePercent = (val: string) => {
          if (!val) return 0;
          let clean = val.replace(/[^0-9.-]/g, '').trim();
          let num = parseFloat(clean) || 0;
          if (val.includes('%')) {
            return num / 100;
          }
          // If value is a ratio e.g. 0.05, keep it; if it's e.g. 5.5 but doesn't have %, check if > 1
          if (num > 1) {
            return num / 100;
          }
          return num;
        };

        const formatted = dataRows.map((row) => {
          const vStr = volumeIdx !== -1 && row[volumeIdx] ? row[volumeIdx].replace(/[^0-9.-]/g, '') : '0';
          const bcStr = brandClicksIdx !== -1 && row[brandClicksIdx] ? row[brandClicksIdx].replace(/[^0-9.-]/g, '') : '0';
          const mcStr = marketClicksIdx !== -1 && row[marketClicksIdx] ? row[marketClicksIdx].replace(/[^0-9.-]/g, '') : '0';

          return {
            period: row[periodIdx] || '',
            searchQuery: row[queryIdx] || '',
            searchVolume: Math.round(parseFloat(vStr) || 0),
            brandClicks: Math.round(parseFloat(bcStr) || 0),
            marketClicks: Math.round(parseFloat(mcStr) || 0),
            brandCtr: brandCtrIdx !== -1 ? parsePercent(row[brandCtrIdx]) : 0,
            marketCtr: marketCtrIdx !== -1 ? parsePercent(row[marketCtrIdx]) : 0,
            brandCvr: brandCvrIdx !== -1 ? parsePercent(row[brandCvrIdx]) : 0,
            marketCvr: marketCvrIdx !== -1 ? parsePercent(row[marketCvrIdx]) : 0,
            purchaseShare: shareIdx !== -1 ? parsePercent(row[shareIdx]) : 0,
          };
        }).filter(r => r.period && r.searchQuery) as RawSQPRow[];

        meta.updater(formatted);
        importedCount = formatted.length;
      }

      setInputText('');
      setImportFeedback({ status: 'success', message: `Successfully matched and imported ${importedCount} records!` });
      setCurrentPage(1);
    } catch (err: any) {
      setImportFeedback({ status: 'error', message: `Import Failed: ${err.message || 'Check header alignment and file format.'}` });
    }
  };

  // Drag and Drop files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleBulkImport(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleBulkImport(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // CRUD on grid
  const handleEditCell = (index: number, key: string, value: string) => {
    const updated = [...meta.data] as any[];
    const isNum = meta.fields.find(f => f.key === key)?.type === 'number';
    const isPct = meta.fields.find(f => f.key === key)?.type === 'percent';
    
    let parsedVal: any = value;
    if (isNum) {
      parsedVal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    } else if (isPct) {
      let clean = value.replace(/[^0-9.-]/g, '');
      let num = parseFloat(clean) || 0;
      if (value.includes('%') || num > 1) {
        parsedVal = num / 100;
      } else {
        parsedVal = num;
      }
    }

    updated[index] = {
      ...updated[index],
      [key]: parsedVal
    };
    meta.updater(updated);
  };

  const handleDeleteRow = (idx: number) => {
    const updated = [...meta.data];
    updated.splice(idx, 1);
    meta.updater(updated);
    // adjust page if empty
    if (currentPage > Math.ceil(updated.length / itemsPerPage) && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAddRow = () => {
    const updated = [meta.defaultRow, ...meta.data];
    meta.updater(updated);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleClearData = () => {
    if (confirm(`Are you sure you want to delete ALL ${meta.data.length} records in this sheet? This cannot be undone.`)) {
      meta.updater([]);
      setCurrentPage(1);
    }
  };

  // Filtering data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return meta.data;
    const s = searchQuery.toLowerCase();
    return meta.data.filter((row: any) => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(s)
      );
    });
  }, [meta.data, searchQuery]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredData, currentPage]);

  // Statistics summaries
  const totals = useMemo(() => {
    if (type === 'sellerCentral') {
      const data = filteredData as RawSellerCentralRow[];
      return {
        units: data.reduce((sum, r) => sum + (r.unitsOrdered || 0), 0),
        sales: data.reduce((sum, r) => sum + (r.orderedProductSales || 0), 0),
        views: data.reduce((sum, r) => sum + (r.pageViews || 0), 0),
        sessions: data.reduce((sum, r) => sum + (r.sessions || 0), 0)
      };
    } else if (type === 'sellerboard') {
      const data = filteredData as RawSellerboardRow[];
      return {
        sales: data.reduce((sum, r) => sum + (r.sales || 0), 0),
        units: data.reduce((sum, r) => sum + (r.units || 0), 0),
        ppc: data.reduce((sum, r) => sum + (r.ppcSpend || 0), 0),
        fees: data.reduce((sum, r) => sum + (r.fees || 0), 0),
        cogs: data.reduce((sum, r) => sum + (r.cogs || 0), 0),
        profit: data.reduce((sum, r) => sum + (r.netProfit || 0), 0)
      };
    } else {
      const data = filteredData as RawSQPRow[];
      return {
        volume: data.reduce((sum, r) => sum + (r.searchVolume || 0), 0),
        brandClicks: data.reduce((sum, r) => sum + (r.brandClicks || 0), 0),
        marketClicks: data.reduce((sum, r) => sum + (r.marketClicks || 0), 0)
      };
    }
  }, [filteredData, type]);

  return (
    <div className="space-y-6 animate-fade-up" id="raw-table-editor">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-md border-l-4 border-[var(--color-primary)]">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase block mb-1">
            Raw Data Clipboard Layer
          </span>
          <h2 className="font-serif-heading text-2xl font-bold text-[var(--color-primary)]">
            {meta.title}
          </h2>
          <p className="text-[12px] text-[var(--color-muted)] mt-1">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddRow}
            className="bg-[var(--color-primary)] text-white text-[13px] font-medium py-2 px-4 rounded-md hover:bg-opacity-90 active:scale-97 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Row
          </button>
          <button
            onClick={handleClearData}
            className="bg-white border border-[var(--color-border)] text-[var(--color-negative)] text-[13px] font-medium py-2 px-4 rounded-md hover:bg-red-50 hover:border-[var(--color-negative)] active:scale-97 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={16} /> Clear Sheet
          </button>
        </div>
      </div>

      {/* Import panel with file upload and text area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Container (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
          <h3 className="font-serif-heading text-base font-semibold text-[var(--color-primary)] flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-accent)]" />
            Bulk CSV/TSV Copy-Paste or Upload
          </h3>
          <p className="text-[12px] text-[var(--color-muted)] leading-relaxed">
            Copy an entire report from Excel or text file and paste it into the textbox, or drop the CSV file here. The engine will automatically match column names and parse values.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drag & Drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                isDragging
                  ? 'border-[var(--color-accent)] bg-[var(--insight-bg)]'
                  : 'border-[var(--color-border)] hover:border-slate-400 bg-slate-50'
              }`}
            >
              <Upload size={32} className="text-slate-400" />
              <div className="text-center">
                <p className="text-[13px] font-semibold text-[var(--color-primary)]">Drop CSV File Here</p>
                <p className="text-[11px] text-[var(--color-muted)] mt-1">or click to browse local drive</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.tsv,.txt"
                className="hidden"
              />
            </div>

            {/* Form submit with raw text */}
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="Paste tab-separated (TSV) or comma-separated (CSV) rows directly from Excel here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full flex-grow h-32 border border-[var(--color-border)] rounded-md p-3 text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:bg-white bg-slate-50"
              />
              <button
                type="button"
                onClick={() => handleBulkImport(inputText)}
                className="w-full bg-[var(--color-primary)] text-white text-[13px] font-medium py-1.5 px-3 rounded hover:bg-opacity-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clipboard size={14} /> Import Copy-Pasted Text
              </button>
            </div>
          </div>

          {importFeedback.status && (
            <div className={`p-3 rounded-lg flex items-start gap-2.5 text-[12px] ${
              importFeedback.status === 'success'
                ? 'bg-green-50 text-[var(--color-positive)] border border-green-200'
                : 'bg-red-50 text-[var(--color-negative)] border border-red-200'
            }`}>
              {importFeedback.status === 'success' ? <Check size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              <div>
                <p className="font-semibold">{importFeedback.status === 'success' ? 'Import Successful' : 'Import Unsuccessful'}</p>
                <p className="mt-0.5 leading-tight">{importFeedback.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Column Mapping Help Card */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-serif-heading text-base font-semibold text-[var(--color-primary)]">
              Supported Columns Guide
            </h4>
            <div className="text-[12px] text-[var(--color-muted)] leading-relaxed space-y-2">
              <p>For best results, keep headers as the very first row.</p>
              <div className="bg-slate-50 p-3 rounded border border-[var(--color-border)] text-[11px] space-y-1.5 max-h-48 overflow-y-auto font-mono custom-scrollbar">
                {meta.fields.map(f => (
                  <div key={f.key} className="flex justify-between border-b border-dashed border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="font-semibold text-[var(--color-primary)]">{f.label}</span>
                    <span className="text-slate-400">{f.type === 'percent' ? 'Percentage' : f.type === 'number' ? 'Integer/Float' : 'Text'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-4">
            * Empty values resolve to standard zero offsets. Date and SKU columns act as standard key anchors.
          </div>
        </div>
      </div>

      {/* Grid view */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Filter controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-serif-heading text-base font-semibold text-[var(--color-primary)]">
              Active Records Sheet ({filteredData.length})
            </h3>
            {searchQuery && (
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-medium">
                filtered
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search raw rows..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 py-1.5 border border-[var(--color-border)] rounded-md text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-60"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] custom-scrollbar">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-[var(--table-header-bg)] text-[var(--color-primary)] border-b-2 border-[var(--table-header-sep)] text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">Row</th>
                {meta.fields.map(f => (
                  <th key={f.key} className={`px-4 py-3 font-semibold ${f.type === 'number' || f.type === 'percent' ? 'text-right' : ''}`}>
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-center w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-white font-sans">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={meta.fields.length + 2} className="px-4 py-12 text-center text-[var(--color-muted)] font-serif-heading italic">
                    {searchQuery ? 'No filtered records matched your keywords.' : 'No records inside database. Paste text above to get started!'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row: any, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <tr key={globalIdx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 text-center text-[var(--color-muted)] font-mono text-[11px]">
                        {globalIdx + 1}
                      </td>
                      {meta.fields.map(f => {
                        let cellVal = row[f.key];
                        // Presenting standard formats
                        let displayVal = cellVal;
                        if (f.type === 'number') {
                          displayVal = f.key.toLowerCase().includes('sales') || f.key.toLowerCase().includes('spend') || f.key.toLowerCase().includes('profit') || f.key.toLowerCase().includes('fees') || f.key.toLowerCase().includes('cogs')
                            ? formatCurrency(cellVal)
                            : formatInteger(cellVal);
                        } else if (f.type === 'percent') {
                          displayVal = formatPercent(cellVal);
                        }

                        return (
                          <td key={f.key} className={`px-4 py-1.5 ${f.type === 'number' || f.type === 'percent' ? 'text-right' : ''}`}>
                            <input
                              type={f.type === 'date' ? 'date' : 'text'}
                              value={
                                f.type === 'percent'
                                  ? (cellVal * 100).toFixed(2)
                                  : cellVal
                              }
                              onChange={(e) => handleEditCell(globalIdx, f.key, e.target.value)}
                              placeholder={f.placeholder}
                              className={`bg-[var(--color-input-bg)] border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] focus:bg-white rounded px-2 py-0.5 outline-none transition-all ${
                                f.type === 'number' || f.type === 'percent' ? 'text-right w-24 font-mono' : 'w-full'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(globalIdx)}
                          className="text-slate-400 hover:text-[var(--color-negative)] p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals Summary Row */}
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-[var(--color-border)] text-[12px] font-semibold text-[var(--color-primary)] font-sans">
                <tr>
                  <td className="px-4 py-3 text-center">SUM</td>
                  {meta.fields.map(f => {
                    let sumVal = '';
                    if (type === 'sellerCentral') {
                      const t = totals as any;
                      if (f.key === 'unitsOrdered') sumVal = formatInteger(t.units);
                      if (f.key === 'orderedProductSales') sumVal = formatCurrency(t.sales);
                      if (f.key === 'pageViews') sumVal = formatInteger(t.views);
                      if (f.key === 'sessions') sumVal = formatInteger(t.sessions);
                    } else if (type === 'sellerboard') {
                      const t = totals as any;
                      if (f.key === 'sales') sumVal = formatCurrency(t.sales);
                      if (f.key === 'units') sumVal = formatInteger(t.units);
                      if (f.key === 'ppcSpend') sumVal = formatCurrency(t.ppc);
                      if (f.key === 'fees') sumVal = formatCurrency(t.fees);
                      if (f.key === 'cogs') sumVal = formatCurrency(t.cogs);
                      if (f.key === 'netProfit') sumVal = formatCurrency(t.profit);
                    } else if (type === 'sqp') {
                      const t = totals as any;
                      if (f.key === 'searchVolume') sumVal = formatInteger(t.volume);
                      if (f.key === 'brandClicks') sumVal = formatInteger(t.brandClicks);
                      if (f.key === 'marketClicks') sumVal = formatInteger(t.marketClicks);
                    }

                    return (
                      <td key={f.key} className={`px-4 py-3 font-mono ${f.type === 'number' || f.type === 'percent' ? 'text-right' : ''}`}>
                        {sumVal || '—'}
                      </td>
                    );
                  })}
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
                // only display around current page if there are too many
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
