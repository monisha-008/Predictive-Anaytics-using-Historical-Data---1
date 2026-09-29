import { RawRow, CleanedRecord, DataQualityReport, ColumnMapping } from '../types';
import { parseDate, formatDateISO } from './dateUtils';

/**
 * Robustly parses a number from any raw value:
 * - Currency symbols: $, ₹, €, £, ¥, etc.
 * - Thousands separators: commas, spaces
 * - Negative numbers in parenthesis: (1,250.50) -> -1250.50
 * Returns null if not a valid number.
 */
export function cleanNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '') {
    return null;
  }

  if (typeof val === 'number') {
    return isFinite(val) ? val : null;
  }

  let str = String(val).trim();
  if (!str) return null;

  // Check for parenthesis negative representation, e.g., (1,250.50)
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.substring(1, str.length - 1).trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  } else if (str.endsWith('-')) {
    isNegative = true;
    str = str.substring(0, str.length - 1).trim();
  }

  // Remove currency symbols ($, ₹, €, £, ¥, kr, etc.), commas, spaces, and percent signs
  // Keep only digits, periods, and minus
  const cleanedStr = str
    .replace(/[$₹€£¥₽₩\s,]/g, '')
    .replace(/%/g, '');

  if (!cleanedStr || isNaN(Number(cleanedStr))) {
    return null;
  }

  const num = parseFloat(cleanedStr);
  if (!isFinite(num)) {
    return null;
  }

  return isNegative ? -Math.abs(num) : num;
}

/**
 * Checks if an entire row is considered empty (all values null, undefined, or empty strings).
 */
export function isRowEmpty(row: RawRow): boolean {
  if (!row || typeof row !== 'object') return true;
  const values = Object.values(row);
  if (values.length === 0) return true;
  return values.every(v => v === null || v === undefined || String(v).trim() === '');
}

/**
 * Cleans and normalizes an entire dataset based on the current column mapping.
 */
export function cleanDataset(
  rawRows: RawRow[],
  mapping: ColumnMapping
): { cleaned: CleanedRecord[]; report: DataQualityReport } {
  const log: string[] = [];
  const seenHashes = new Set<string>();

  let totalRows = rawRows.length;
  let emptyRowsCount = 0;
  let duplicateRowsCount = 0;
  let missingValuesCount = 0;
  let invalidValuesCount = 0;

  const validRecords: CleanedRecord[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];

    if (isRowEmpty(raw)) {
      emptyRowsCount++;
      continue;
    }

    // Deduplication check: compute simple row hash
    const rowHash = JSON.stringify(raw);
    if (seenHashes.has(rowHash)) {
      duplicateRowsCount++;
      continue;
    }
    seenHashes.add(rowHash);

    // Extract mapped fields
    const rawDateVal = mapping.dateColumn ? raw[mapping.dateColumn] : undefined;
    const rawTargetVal = mapping.targetColumn ? raw[mapping.targetColumn] : undefined;
    const rawCatVal = mapping.categoryColumn ? raw[mapping.categoryColumn] : undefined;
    const rawProdVal = mapping.productColumn ? raw[mapping.productColumn] : undefined;

    // Clean Date
    let parsedDate: Date | null = null;
    let isoDate: string | undefined = undefined;
    let timestamp: number | undefined = undefined;

    if (mapping.dateColumn) {
      if (rawDateVal === null || rawDateVal === undefined || rawDateVal === '') {
        missingValuesCount++;
      } else {
        parsedDate = parseDate(rawDateVal);
        if (parsedDate) {
          isoDate = formatDateISO(parsedDate);
          timestamp = parsedDate.getTime();
        } else {
          invalidValuesCount++;
        }
      }
    }

    // Clean Target
    let cleanedTarget: number | null = null;
    if (mapping.targetColumn) {
      if (rawTargetVal === null || rawTargetVal === undefined || rawTargetVal === '') {
        missingValuesCount++;
      } else {
        cleanedTarget = cleanNumericValue(rawTargetVal);
        if (cleanedTarget === null) {
          invalidValuesCount++;
        }
      }
    }

    // Clean Category & Product
    const category = rawCatVal !== null && rawCatVal !== undefined && String(rawCatVal).trim() !== ''
      ? String(rawCatVal).trim()
      : undefined;

    const product = rawProdVal !== null && rawProdVal !== undefined && String(rawProdVal).trim() !== ''
      ? String(rawProdVal).trim()
      : undefined;

    // Check if record is valid:
    // If target column is specified, we require a valid numeric target.
    // If date column is specified, we prefer a valid date (if date missing/invalid, we still preserve raw if target is valid, or vice-versa).
    const hasValidTarget = mapping.targetColumn ? cleanedTarget !== null : true;

    if (hasValidTarget) {
      validRecords.push({
        _id: `rec-${i}-${Date.now()}`,
        date: isoDate,
        timestamp,
        target: cleanedTarget !== null ? cleanedTarget : undefined,
        category,
        product,
        raw,
      });
    }
  }

  // Sort valid records by timestamp if date exists
  if (mapping.dateColumn) {
    validRecords.sort((a, b) => {
      if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
      if (a.date && b.date) return a.date.localeCompare(b.date);
      return 0;
    });
  }

  if (emptyRowsCount > 0) {
    log.push(`Removed ${emptyRowsCount} completely empty row${emptyRowsCount > 1 ? 's' : ''}.`);
  }
  if (duplicateRowsCount > 0) {
    log.push(`Removed ${duplicateRowsCount} duplicate record${duplicateRowsCount > 1 ? 's' : ''}.`);
  }
  if (missingValuesCount > 0) {
    log.push(`Handled ${missingValuesCount} missing value field${missingValuesCount > 1 ? 's' : ''}.`);
  }
  if (invalidValuesCount > 0) {
    log.push(`Filtered out ${invalidValuesCount} unparseable or corrupted value${invalidValuesCount > 1 ? 's' : ''}.`);
  }
  log.push(`Successfully retained ${validRecords.length} clean, validated records.`);

  const report: DataQualityReport = {
    totalRows,
    validRows: validRecords.length,
    missingValues: missingValuesCount,
    duplicateRows: duplicateRowsCount,
    invalidValues: invalidValuesCount,
    cleaningLog: log,
  };

  return { cleaned: validRecords, report };
}
