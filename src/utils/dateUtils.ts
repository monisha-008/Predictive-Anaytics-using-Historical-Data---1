import { Granularity, ForecastHorizon } from '../types';

/**
 * Converts an Excel serial date number (e.g. 44927) to a standard JavaScript Date.
 * Excel day 1 is 1900-01-01, with a leap-year bug at day 60.
 * Dec 30, 1899 is the standard epoch offset (25569 days between 1899-12-30 and 1970-01-01).
 */
export function excelSerialToDate(serial: number): Date | null {
  if (isNaN(serial) || serial <= 0 || serial > 2958465) {
    return null;
  }
  // Days to milliseconds
  const utcMilliseconds = (serial - 25569) * 86400 * 1000;
  const date = new Date(utcMilliseconds);
  // Account for timezone offset to prevent date shifting
  const offsetMinutes = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() + offsetMinutes * 60000);
  return isNaN(adjusted.getTime()) ? null : adjusted;
}

/**
 * Robustly parses a date value from various formats:
 * - Excel serial number
 * - ISO string: 2026-05-15
 * - Slash formats: MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD
 * - Timestamp in milliseconds or seconds
 */
export function parseDate(value: any): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If number, could be excel serial or unix timestamp
  if (typeof value === 'number') {
    if (value > 25000 && value < 60000) {
      // Very likely Excel serial date (e.g. 44927 ≈ year 2023)
      const excelDate = excelSerialToDate(value);
      if (excelDate) return excelDate;
    }
    // Unix timestamp in seconds or ms
    const timestamp = value > 1e11 ? value : value * 1000;
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d;
  }

  const str = String(value).trim();
  if (!str) return null;

  // Check if string is a numeric excel serial
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    const excelDate = excelSerialToDate(num);
    if (excelDate) return excelDate;
  }

  // Handle common date strings
  // Handle DD-MM-YYYY or DD/MM/YYYY vs MM/DD/YYYY
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    // If year is first: YYYY-MM-DD
    if (p0 > 1000) {
      const d = new Date(p0, p1 - 1, p2);
      if (!isNaN(d.getTime())) return d;
    }
    // If year is last: DD-MM-YYYY or MM-DD-YYYY
    if (p2 > 1000) {
      // If p0 > 12, p0 must be day
      if (p0 > 12 && p1 <= 12) {
        const d = new Date(p2, p1 - 1, p0);
        if (!isNaN(d.getTime())) return d;
      }
      // If p1 > 12, p1 must be day
      if (p1 > 12 && p0 <= 12) {
        const d = new Date(p2, p0 - 1, p1);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a Date into standard YYYY-MM-DD string
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Detects the data frequency / granularity: Daily, Weekly, or Monthly.
 * Uses the median interval (in days) between consecutive chronologically sorted timestamps.
 */
export function detectGranularity(dates: Date[]): Granularity {
  if (dates.length < 2) {
    return 'Daily';
  }

  // Sort timestamps in ascending order
  const timestamps = dates
    .map(d => d.getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);

  if (timestamps.length < 2) {
    return 'Daily';
  }

  // Deduplicate timestamps on same day
  const dayTimestamps: number[] = [];
  const seenDays = new Set<string>();
  for (const t of timestamps) {
    const key = new Date(t).toISOString().slice(0, 10);
    if (!seenDays.has(key)) {
      seenDays.add(key);
      dayTimestamps.push(t);
    }
  }

  if (dayTimestamps.length < 2) {
    return 'Daily';
  }

  const intervalsInDays: number[] = [];
  for (let i = 1; i < dayTimestamps.length; i++) {
    const diffDays = (dayTimestamps[i] - dayTimestamps[i - 1]) / (1000 * 60 * 60 * 24);
    if (diffDays > 0) {
      intervalsInDays.push(diffDays);
    }
  }

  if (intervalsInDays.length === 0) {
    return 'Daily';
  }

  // Calculate median difference
  intervalsInDays.sort((a, b) => a - b);
  const mid = Math.floor(intervalsInDays.length / 2);
  const medianDays = intervalsInDays.length % 2 === 0
    ? (intervalsInDays[mid - 1] + intervalsInDays[mid]) / 2
    : intervalsInDays[mid];

  if (medianDays < 3.5) {
    return 'Daily';
  } else if (medianDays <= 18) {
    return 'Weekly';
  } else {
    return 'Monthly';
  }
}

/**
 * Converts a forecast horizon (7, 30, or 90 days) into the number of future periods
 * based on the detected dataset granularity.
 *
 * Rules:
 * Daily:
 * - 7 days = 7 periods
 * - 30 days = 30 periods
 * - 90 days = 90 periods
 *
 * Weekly:
 * - 7 days ≈ 1 period
 * - 30 days ≈ 4 periods
 * - 90 days ≈ 13 periods
 *
 * Monthly:
 * - 7 days ≈ 1 period
 * - 30 days ≈ 1 period
 * - 90 days ≈ 3 periods
 */
export function convertHorizonToPeriods(horizon: ForecastHorizon, granularity: Granularity): number {
  if (granularity === 'Daily') {
    switch (horizon) {
      case 7: return 7;
      case 30: return 30;
      case 90: return 90;
      default: return 7;
    }
  }

  if (granularity === 'Weekly') {
    switch (horizon) {
      case 7: return 1;
      case 30: return 4;
      case 90: return 13;
      default: return 4;
    }
  }

  // Monthly
  switch (horizon) {
    case 7: return 1;
    case 30: return 1;
    case 90: return 3;
    default: return 1;
  }
}

/**
 * Advances a date by a given number of steps based on granularity.
 */
export function addPeriodsToDate(baseDate: Date, steps: number, granularity: Granularity): Date {
  const result = new Date(baseDate.getTime());
  if (granularity === 'Daily') {
    result.setDate(result.getDate() + steps);
  } else if (granularity === 'Weekly') {
    result.setDate(result.getDate() + steps * 7);
  } else if (granularity === 'Monthly') {
    result.setMonth(result.getMonth() + steps);
  }
  return result;
}
