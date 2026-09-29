import Papa from 'papaparse';
import { RawRow } from '../types';

export interface CsvParseResult {
  data: RawRow[];
  fields: string[];
  errors: string[];
}

export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const fields = results.meta.fields || (results.data.length > 0 ? Object.keys(results.data[0]) : []);
        const errors = results.errors.map(e => `Row ${e.row ?? '?'}: ${e.message}`);
        resolve({
          data: results.data as RawRow[],
          fields,
          errors,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parseCsvString(csvText: string): CsvParseResult {
  const results = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const fields = results.meta.fields || (results.data.length > 0 ? Object.keys(results.data[0]) : []);
  const errors = results.errors.map(e => `Row ${e.row ?? '?'}: ${e.message}`);

  return {
    data: results.data as RawRow[],
    fields,
    errors,
  };
}
