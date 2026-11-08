/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Calculate week number matching WEEKNUM(dt, 2)
export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

// Convert a date string "YYYY-MM-DD" to standard Period Tag
export function getPeriodTag(dateStr: string, analysisType: 'Weekly' | 'Monthly'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return '';
  
  if (analysisType === 'Monthly') {
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mStr}`;
  } else {
    // We want the year based on the week number.
    // If a date is at the very end of Dec or start of Jan, 
    // we use the actual year of the week's Thursday.
    const dateCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dateCopy.getUTCDay() || 7;
    dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - dayNum);
    const targetYear = dateCopy.getUTCFullYear();
    const week = String(getWeekNumber(d)).padStart(2, '0');
    return `${targetYear}-W${week}`;
  }
}

// Calculate Prior Period
export function calculatePriorPeriod(curr: string, type: 'Weekly' | 'Monthly'): string {
  if (!curr) return '';
  if (type === 'Weekly') {
    // format YYYY-Wxx
    const match = curr.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return '';
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    if (week > 1) {
      return `${year}-W${String(week - 1).padStart(2, '0')}`;
    } else {
      // Roll back to week 52 of previous year
      return `${year - 1}-W52`;
    }
  } else {
    // format YYYY-MM
    const match = curr.match(/^(\d{4})-(\d{2})$/);
    if (!match) return '';
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (month > 1) {
      return `${year}-${String(month - 1).padStart(2, '0')}`;
    } else {
      return `${year - 1}-12`;
    }
  }
}

// Parse CSV or TSV text into an array of objects
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  if (!text) return lines;
  
  // Clean carriage returns
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = cleanText.split('\n');
  
  for (let rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    
    // Detect TSV vs CSV
    let separator = ',';
    const tabCount = (rawLine.match(/\t/g) || []).length;
    const commaCount = (rawLine.match(/,/g) || []).length;
    if (tabCount > commaCount) {
      separator = '\t';
    }
    
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === separator && !insideQuote) {
        row.push(entry.trim().replace(/^"|"$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^"|"$/g, ''));
    lines.push(row);
  }
  return lines;
}

// Format numbers
export function formatCurrency(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  const prefix = val < 0 ? '-$' : '$';
  return prefix + Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatInteger(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return val.toLocaleString('en-US');
}

export function formatPercent(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0.00%';
  return (val * 100).toFixed(2) + '%';
}

export function formatPercentOneDecimal(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return (val * 100).toFixed(1) + '%';
}
