import { RawRow, ColumnMapping, ColumnSchema, DetectedDataType } from '../types';
import { parseDate } from './dateUtils';
import { cleanNumericValue } from './dataCleaning';

const DATE_KEYWORDS = ['date', 'time', 'timestamp', 'day', 'month', 'year', 'period', 'order_date', 'sale_date', 'transaction_date'];
const TARGET_KEYWORDS = ['revenue', 'sales', 'amount', 'total', 'price', 'profit', 'income', 'turnover', 'target', 'gmv', 'value', 'earnings', 'volume', 'qty', 'quantity'];
const CATEGORY_KEYWORDS = ['category', 'segment', 'department', 'type', 'genre', 'class', 'group', 'channel', 'region'];
const PRODUCT_KEYWORDS = ['product', 'item', 'sku', 'name', 'product_name', 'item_name', 'title', 'model', 'description'];

/**
 * Detects the data type of a given column from a sample of rows.
 */
export function detectColumnType(rows: RawRow[], columnName: string): { type: DetectedDataType; sample: string } {
  let sample = '';
  let validDateCount = 0;
  let validNumberCount = 0;
  let validBoolCount = 0;
  let totalNonEmpty = 0;

  const sampleLimit = Math.min(rows.length, 100);

  for (let i = 0; i < sampleLimit; i++) {
    const val = rows[i][columnName];
    if (val === null || val === undefined || String(val).trim() === '') {
      continue;
    }

    if (!sample) {
      sample = String(val).slice(0, 30);
    }

    totalNonEmpty++;

    // Boolean check
    if (typeof val === 'boolean' || val === 'true' || val === 'false') {
      validBoolCount++;
      continue;
    }

    // Number check
    if (typeof val === 'number') {
      validNumberCount++;
      // could also be a date serial number if between 30000 and 60000
      if (val > 30000 && val < 60000) {
        validDateCount++;
      }
      continue;
    }

    const str = String(val).trim();

    // Check if numeric string
    if (cleanNumericValue(str) !== null) {
      validNumberCount++;
    }

    // Check if date string
    // Distinguish numeric string like "120" from date "2026-01-01"
    if (isNaN(Number(str)) || /[-/.]/.test(str)) {
      if (parseDate(str) !== null) {
        validDateCount++;
      }
    }
  }

  if (totalNonEmpty === 0) {
    return { type: 'unknown', sample: '' };
  }

  // Priority: if date ratio >= 70% and column has date-like features
  if (validDateCount / totalNonEmpty >= 0.7) {
    return { type: 'date', sample };
  }

  if (validNumberCount / totalNonEmpty >= 0.7) {
    return { type: 'number', sample };
  }

  if (validBoolCount / totalNonEmpty >= 0.7) {
    return { type: 'boolean', sample };
  }

  return { type: 'string', sample };
}

/**
 * Inspects all columns in the dataset and infers candidate roles.
 */
export function detectColumns(rows: RawRow[]): { mapping: ColumnMapping; schema: ColumnSchema[] } {
  if (rows.length === 0) {
    return {
      mapping: { dateColumn: '', targetColumn: '', categoryColumn: '', productColumn: '' },
      schema: [],
    };
  }

  const columns = Object.keys(rows[0]);
  const schema: ColumnSchema[] = [];

  let bestDateCol = '';
  let bestTargetCol = '';
  let bestCategoryCol = '';
  let bestProductCol = '';

  let highestDateScore = -1;
  let highestTargetScore = -1;
  let highestCatScore = -1;
  let highestProdScore = -1;

  for (const col of columns) {
    const colLower = col.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const { type, sample } = detectColumnType(rows, col);

    // Calculate statistics
    const uniqueValues = new Set<string>();
    let missingCount = 0;

    for (const r of rows) {
      const v = r[col];
      if (v === null || v === undefined || String(v).trim() === '') {
        missingCount++;
      } else {
        uniqueValues.add(String(v));
      }
    }

    // Score Date Column
    let dateScore = 0;
    if (type === 'date') dateScore += 50;
    if (DATE_KEYWORDS.some(kw => colLower.includes(kw))) dateScore += 40;
    if (colLower === 'date' || colLower === 'order_date') dateScore += 30;

    if (dateScore > highestDateScore && dateScore >= 40) {
      highestDateScore = dateScore;
      bestDateCol = col;
    }

    // Score Target Column
    let targetScore = 0;
    if (type === 'number') targetScore += 50;
    if (TARGET_KEYWORDS.some(kw => colLower.includes(kw))) targetScore += 40;
    if (colLower === 'revenue' || colLower === 'sales' || colLower === 'amount') targetScore += 30;
    // Lower score if it looks like an ID
    if (colLower.endsWith('_id') || colLower === 'id') targetScore -= 60;

    if (targetScore > highestTargetScore && targetScore >= 40) {
      highestTargetScore = targetScore;
      bestTargetCol = col;
    }

    // Score Category Column
    let catScore = 0;
    if (type === 'string') catScore += 20;
    if (CATEGORY_KEYWORDS.some(kw => colLower.includes(kw))) catScore += 50;
    // A good category typically has low to moderate cardinality
    if (uniqueValues.size >= 2 && uniqueValues.size <= 30) catScore += 25;

    if (catScore > highestCatScore && catScore >= 35) {
      highestCatScore = catScore;
      bestCategoryCol = col;
    }

    // Score Product Column
    let prodScore = 0;
    if (type === 'string') prodScore += 20;
    if (PRODUCT_KEYWORDS.some(kw => colLower.includes(kw))) prodScore += 50;
    if (col !== bestCategoryCol && uniqueValues.size > 2) prodScore += 15;

    if (prodScore > highestProdScore && prodScore >= 35) {
      highestProdScore = prodScore;
      bestProductCol = col;
    }

    schema.push({
      name: col,
      detectedType: type,
      sampleValue: sample,
      uniqueCount: uniqueValues.size,
      missingCount,
      totalCount: rows.length,
      isRequired: false,
      selectedRole: 'none',
    });
  }

  // Ensure category and product aren't the same column
  if (bestProductCol === bestCategoryCol && bestProductCol !== '') {
    // Pick another product column if possible
    bestProductCol = '';
  }

  // Fallback target: if no target found by keyword, pick the first numeric column that isn't date
  if (!bestTargetCol) {
    const numCol = schema.find(s => s.detectedType === 'number' && s.name !== bestDateCol && !s.name.toLowerCase().includes('id'));
    if (numCol) bestTargetCol = numCol.name;
  }

  // Fallback date: if no date found, pick first date-type column
  if (!bestDateCol) {
    const dCol = schema.find(s => s.detectedType === 'date');
    if (dCol) bestDateCol = dCol.name;
  }

  // Set roles in schema
  for (const s of schema) {
    if (s.name === bestDateCol) {
      s.selectedRole = 'date';
      s.isRequired = true;
    } else if (s.name === bestTargetCol) {
      s.selectedRole = 'target';
      s.isRequired = true;
    } else if (s.name === bestCategoryCol) {
      s.selectedRole = 'category';
    } else if (s.name === bestProductCol) {
      s.selectedRole = 'product';
    }
  }

  return {
    mapping: {
      dateColumn: bestDateCol,
      targetColumn: bestTargetCol,
      categoryColumn: bestCategoryCol,
      productColumn: bestProductCol,
    },
    schema,
  };
}
