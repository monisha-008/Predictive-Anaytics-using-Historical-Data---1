import * as XLSX from 'xlsx';
import { RawRow, SheetInfo } from '../types';
import { excelSerialToDate, formatDateISO } from './dateUtils';

export interface ExcelWorkbookInfo {
  sheets: SheetInfo[];
  defaultSheet: string;
  workbook: XLSX.WorkBook;
}

/**
 * Reads an Excel file (XLSX, XLS) and returns the workbook metadata and sheets.
 */
export async function readExcelWorkbook(file: File): Promise<ExcelWorkbookInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true, // Auto parse date cells where possible
  });

  const sheets: SheetInfo[] = workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    // Fast estimation of row count from range
    const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
    const rowCount = range ? range.e.r - range.s.r : 0;
    return {
      name: sheetName,
      rowCount: Math.max(0, rowCount),
    };
  });

  return {
    sheets,
    defaultSheet: workbook.SheetNames[0] || '',
    workbook,
  };
}

/**
 * Extracts data rows from a specific sheet in the workbook.
 * Converts Excel serial dates or unformatted date values appropriately.
 */
export function extractSheetData(workbook: XLSX.WorkBook, sheetName: string): RawRow[] {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  // Parse as raw JSON objects
  const rawData = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
    defval: '',
    raw: false, // get formatted text where available
    dateNF: 'yyyy-mm-dd', // format dates
  });

  // Post-process to handle any residual Excel serial numbers in date columns
  return rawData.map(row => {
    const processedRow: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.trim();
      if (value instanceof Date) {
        processedRow[cleanKey] = formatDateISO(value);
      } else if (typeof value === 'number' && value > 25000 && value < 60000 && /date|time|day/i.test(cleanKey)) {
        const d = excelSerialToDate(value);
        processedRow[cleanKey] = d ? formatDateISO(d) : value;
      } else {
        processedRow[cleanKey] = value;
      }
    }
    return processedRow;
  });
}
