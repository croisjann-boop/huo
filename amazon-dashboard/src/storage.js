import { DEFAULT_THRESHOLDS, validateThresholds } from './core.js';

export function readSetting(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
export function writeSetting(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function loadThresholds() {
  return validateThresholds(readSetting('amz-threshold', null)) ?? { ...DEFAULT_THRESHOLDS };
}

export function loadFrequency() {
  const value = readSetting('amz-frequency', null);
  if (value === 'daily' || value === 'weekly') return value;
  // 保留从原单文件版本迁移过来的更新频率。
  try { return localStorage.getItem('demo-frequency') === '每周' ? 'weekly' : 'daily'; }
  catch { return 'daily'; }
}
