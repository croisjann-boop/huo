/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ConfigParam, RawSellerCentralRow, RawSellerboardRow, RawSQPRow } from './types';
import { getPeriodTag } from './utils';

// Import initial mock data
import {
  INITIAL_SKU_MAP,
  INITIAL_SELLER_CENTRAL,
  INITIAL_SELLERBOARD,
  INITIAL_SQP
} from './initialData';

// Import child views
import DashExecutive from './components/DashExecutive';
import ConfigParamView from './components/ConfigParamView';
import RawTableEditor from './components/RawTableEditor';
import FactSalesTable from './components/FactSalesTable';
import FactSQPTable from './components/FactSQPTable';
import AnlySKUPerformanceTable from './components/AnlySKUPerformanceTable';
import AnlyKeywordPerformanceTable from './components/AnlyKeywordPerformanceTable';

// Icons
import {
  Settings,
  Database,
  Grid,
  BarChart2,
  PieChart,
  Activity,
  FileText,
  TrendingUp,
  Download,
  Upload,
  RotateCcw,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // ─── 1. State Managers & LocalStorage Initialization ───
  const [config, setConfig] = useState<ConfigParam>(() => {
    const saved = localStorage.getItem('amz_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      analysisType: 'Weekly',
      currentPeriod: '2026-W27',
      priorPeriod: '2026-W26',
      skuMap: INITIAL_SKU_MAP
    };
  });

  const [rawSellerCentral, setRawSellerCentral] = useState<RawSellerCentralRow[]>(() => {
    const saved = localStorage.getItem('amz_raw_seller_central');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SELLER_CENTRAL;
  });

  const [rawSellerboard, setRawSellerboard] = useState<RawSellerboardRow[]>(() => {
    const saved = localStorage.getItem('amz_raw_sellerboard');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SELLERBOARD;
  });

  const [rawSQP, setRawSQP] = useState<RawSQPRow[]>(() => {
    const saved = localStorage.getItem('amz_raw_sqp');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_SQP;
  });

  // Navigation tab mirroring the 9 worksheets
  const [activeTab, setActiveTab] = useState<string>('dash_executive');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isSavedBadgeVisible, setIsSavedBadgeVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 2. Auto-Saving Mechanism ───
  useEffect(() => {
    localStorage.setItem('amz_config', JSON.stringify(config));
    localStorage.setItem('amz_raw_seller_central', JSON.stringify(rawSellerCentral));
    localStorage.setItem('amz_raw_sellerboard', JSON.stringify(rawSellerboard));
    localStorage.setItem('amz_raw_sqp', JSON.stringify(rawSQP));

    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    setLastSaved(timeStr);

    setIsSavedBadgeVisible(true);
    const timer = setTimeout(() => setIsSavedBadgeVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [config, rawSellerCentral, rawSellerboard, rawSQP]);

  // ─── 3. Reactive Formulas & Calculations (XLOOKUP & MAP) ───
  // Fact_Sales Wide Ledger compilation
  const factSales = useMemo(() => {
    const keySet = new Set<string>();
    const entries: { date: string; sku: string }[] = [];

    // Collect trade keys (Date + SKU) from both financial tables
    for (const r of rawSellerboard) {
      if (r.date && r.sku) {
        const key = `${r.date}|||${r.sku}`;
        if (!keySet.has(key)) {
          keySet.add(key);
          entries.push({ date: r.date, sku: r.sku });
        }
      }
    }

    for (const r of rawSellerCentral) {
      if (r.date && r.sku) {
        const key = `${r.date}|||${r.sku}`;
        if (!keySet.has(key)) {
          keySet.add(key);
          entries.push({ date: r.date, sku: r.sku });
        }
      }
    }

    // Sort entries chronological, then alphabetical SKU
    entries.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.sku.localeCompare(b.sku);
    });

    // Populate compiled rows
    return entries.map(entry => {
      const { date, sku } = entry;

      // XLOOKUP Parent ASIN in SKU Map
      const mapItem = config.skuMap.find(item => item.sku === sku);
      const parentAsin = mapItem ? mapItem.parentAsin : 'Unmapped';

      // Sumifs from sellerboard
      const sbMatches = rawSellerboard.filter(r => r.date === date && r.sku === sku);
      const sbSales = sbMatches.reduce((sum, r) => sum + r.sales, 0);
      const sbUnits = sbMatches.reduce((sum, r) => sum + r.units, 0);
      const ppcSpend = sbMatches.reduce((sum, r) => sum + r.ppcSpend, 0);
      const netProfit = sbMatches.reduce((sum, r) => sum + r.netProfit, 0);

      // Sumifs from sellerCentral
      const scMatches = rawSellerCentral.filter(r => r.date === date && r.sku === sku);
      const scSales = scMatches.reduce((sum, r) => sum + r.orderedProductSales, 0);
      const scUnits = scMatches.reduce((sum, r) => sum + r.unitsOrdered, 0);

      // Logical fallback per instructions
      const salesRevenue = sbMatches.length > 0 ? sbSales : scSales;
      const unitsOrdered = sbMatches.length > 0 ? sbUnits : scUnits;

      // Period Tag mapping based on Config Analysis_Type
      const periodTag = getPeriodTag(date, config.analysisType);

      return {
        date,
        sku,
        parentAsin,
        salesRevenue,
        unitsOrdered,
        ppcSpend,
        netProfit,
        periodTag
      };
    });
  }, [rawSellerboard, rawSellerCentral, config.skuMap, config.analysisType]);

  // Fact_SQP compiler
  const factSqp = useMemo(() => {
    return rawSQP.map(row => {
      const ctrGap = row.brandCtr - row.marketCtr;
      return {
        ...row,
        ctrGap
      };
    });
  }, [rawSQP]);

  // Dynamic available periods in dataset to let executives pick
  const availablePeriods = useMemo(() => {
    const list = Array.from(new Set(factSales.map(r => r.periodTag).filter(Boolean))) as string[];
    // If empty, supply default config
    if (list.length === 0) return [config.currentPeriod];
    // Sort descending so recent comes first
    return list.sort((a, b) => b.localeCompare(a));
  }, [factSales, config.currentPeriod]);

  // ─── 4. Backup Operations (Export / Import / Reset) ───
  const handleExportBackup = () => {
    const payload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      config,
      rawSellerCentral,
      rawSellerboard,
      rawSQP
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amazon-wbr-sqp-analytics-template-backup-${config.currentPeriod}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const payload = JSON.parse(evt.target?.result as string);
        if (payload.config && payload.rawSellerCentral && payload.rawSellerboard && payload.rawSQP) {
          setConfig(payload.config);
          setRawSellerCentral(payload.rawSellerCentral);
          setRawSellerboard(payload.rawSellerboard);
          setRawSQP(payload.rawSQP);
          alert('Backup imported successfully! All ledger formulas re-aligned.');
          setActiveTab('dash_executive');
        } else {
          alert('Invalid backup schema. Required worksheets parameters missing.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON. File corrupted.');
      }
    };
    reader.readAsText(file);
    // clear input
    e.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to the demo workspace defaults? All customized worksheets will be overwritten.')) {
      localStorage.removeItem('amz_config');
      localStorage.removeItem('amz_raw_seller_central');
      localStorage.removeItem('amz_raw_sellerboard');
      localStorage.removeItem('amz_raw_sqp');

      setConfig({
        analysisType: 'Weekly',
        currentPeriod: '2026-W27',
        priorPeriod: '2026-W26',
        skuMap: INITIAL_SKU_MAP
      });
      setRawSellerCentral(INITIAL_SELLER_CENTRAL);
      setRawSellerboard(INITIAL_SELLERBOARD);
      setRawSQP(INITIAL_SQP);

      setActiveTab('dash_executive');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-body-text)] flex flex-col font-sans selection:bg-blue-100 selection:text-[var(--color-accent)]">
      
      {/* ─── STICKY TOP NAVIGATION BAR (56px) ─── */}
      <nav className="sticky top-0 z-50 h-[56px] bg-white border-b border-[var(--nav-border)] shadow-nav flex items-center justify-between px-6 select-none">
        
        {/* Left Side: Brand Logo & Product Note */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-serif-display text-xl font-bold tracking-tight text-[var(--color-primary)]">
            Theseus Workshop
          </span>
          <span className="text-gray-300 select-none">|</span>
          <span className="text-[12px] font-mono text-[var(--color-muted)] tracking-tight">
            amazon-wbr-sqp-analytics-template
          </span>
        </div>

        {/* Right Side: Tab switcher corresponding to 9 sheets */}
        <div className="flex h-full overflow-x-auto custom-scrollbar">
          {[
            { id: 'dash_executive', label: 'Dash_Executive' },
            { id: 'config_param', label: 'Config_Param' },
            { id: 'raw_sellerboard', label: 'Raw_Sellerboard' },
            { id: 'raw_seller_central', label: 'Raw_Seller_Central' },
            { id: 'raw_sqp', label: 'Raw_SQP' },
            { id: 'fact_sales', label: 'Fact_Sales' },
            { id: 'fact_sqp', label: 'Fact_SQP' },
            { id: 'anly_sku_performance', label: 'Anly_SKU_Performance' },
            { id: 'anly_keyword_performance', label: 'Anly_Keyword_Performance' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full px-4 text-[13px] font-semibold flex items-center relative transition-all cursor-pointer border-b-3 ${
                  isActive
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-transparent text-[var(--nav-text-inactive)] hover:text-[var(--color-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── WORKSPACE UTILITY TOOLBAR ─── */}
      <div className="bg-white/70 border-b border-[var(--color-border)] py-2.5 px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12px] select-none">
        
        {/* Database Integrity Metrics */}
        <div className="flex items-center gap-4 text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" />
            <span>Last saved: <span className="font-bold text-[var(--color-primary)]">{lastSaved || '—'}</span></span>
          </div>
          {isSavedBadgeVisible && (
            <span className="flex items-center gap-1 text-[var(--color-positive)] font-semibold text-[11px] animate-fade-up">
              <CheckCircle2 size={12} /> Auto-saved
            </span>
          )}
        </div>

        {/* Backup Operations */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded text-[11px] font-medium transition-all active:scale-97 cursor-pointer"
            title="Download full JSON snapshot backup of all worksheets"
          >
            <Download size={13} /> Export Backup
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded text-[11px] font-medium transition-all active:scale-97 cursor-pointer"
            title="Restore a previous JSON snapshot file"
          >
            <Upload size={13} /> Import Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[var(--color-negative)] py-1 px-3 rounded text-[11px] font-semibold transition-all active:scale-97 cursor-pointer"
            title="Restore workspace back to demo parameters"
          >
            <RotateCcw size={13} /> Reset Data
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT CONTAINER (Max 1400px centered with 40px padding) ─── */}
      <main className="flex-grow max-w-[1400px] w-full mx-auto px-10 py-10">
        
        {/* Dynamic Route views switching */}
        {activeTab === 'dash_executive' && (
          <DashExecutive
            factSales={factSales}
            skuMap={config.skuMap}
            factSqp={factSqp}
            currentPeriod={config.currentPeriod}
            priorPeriod={config.priorPeriod}
            onUpdatePeriod={(p) => {
              // Sync period with config
              setConfig(prev => ({
                ...prev,
                currentPeriod: p,
                priorPeriod: getPeriodTag(p, prev.analysisType) || prev.priorPeriod // fallback if calculated prior can be retrieved
              }));
            }}
            availablePeriods={availablePeriods}
          />
        )}

        {activeTab === 'config_param' && (
          <ConfigParamView
            config={config}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'raw_sellerboard' && (
          <RawTableEditor
            type="sellerboard"
            sellerCentralData={rawSellerCentral}
            sellerboardData={rawSellerboard}
            sqpData={rawSQP}
            onUpdateSellerCentral={setRawSellerCentral}
            onUpdateSellerboard={setRawSellerboard}
            onUpdateSQP={setRawSQP}
          />
        )}

        {activeTab === 'raw_seller_central' && (
          <RawTableEditor
            type="sellerCentral"
            sellerCentralData={rawSellerCentral}
            sellerboardData={rawSellerboard}
            sqpData={rawSQP}
            onUpdateSellerCentral={setRawSellerCentral}
            onUpdateSellerboard={setRawSellerboard}
            onUpdateSQP={setRawSQP}
          />
        )}

        {activeTab === 'raw_sqp' && (
          <RawTableEditor
            type="sqp"
            sellerCentralData={rawSellerCentral}
            sellerboardData={rawSellerboard}
            sqpData={rawSQP}
            onUpdateSellerCentral={setRawSellerCentral}
            onUpdateSellerboard={setRawSellerboard}
            onUpdateSQP={setRawSQP}
          />
        )}

        {activeTab === 'fact_sales' && (
          <FactSalesTable
            data={factSales}
          />
        )}

        {activeTab === 'fact_sqp' && (
          <FactSQPTable
            data={factSqp}
          />
        )}

        {activeTab === 'anly_sku_performance' && (
          <AnlySKUPerformanceTable
            factSales={factSales}
            skuMap={config.skuMap}
            currentPeriod={config.currentPeriod}
            priorPeriod={config.priorPeriod}
          />
        )}

        {activeTab === 'anly_keyword_performance' && (
          <AnlyKeywordPerformanceTable
            factSqp={factSqp}
            currentPeriod={config.currentPeriod}
            priorPeriod={config.priorPeriod}
          />
        )}
      </main>
      
      {/* ─── FOOTER ─── */}
      <footer className="mt-auto py-5 border-t border-[var(--color-border)] text-center bg-white/50">
        <p className="text-[12px] text-[var(--color-muted)]">
          All data in this tool is stored in your browser's localStorage. The page itself does not retain any user data.
        </p>
      </footer>
    </div>
  );
}
