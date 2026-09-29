import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Layers, RotateCcw } from 'lucide-react';
import { parseCsvFile } from '../utils/csvParser';
import { readExcelWorkbook, extractSheetData, ExcelWorkbookInfo } from '../utils/excelParser';
import { SheetInfo, RawRow } from '../types';

interface UploadAreaProps {
  onDataLoaded: (rows: RawRow[], fileName: string) => void;
  onResetSample: () => void;
  currentFileName: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onDataLoaded,
  onResetSample,
  currentFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Multi-sheet workbook state
  const [excelWorkbook, setExcelWorkbook] = useState<ExcelWorkbookInfo | null>(null);
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [activeFileName, setActiveFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setExcelWorkbook(null);
    setAvailableSheets([]);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv') {
        const { data, errors } = await parseCsvFile(file);
        if (data.length === 0) {
          throw new Error('CSV file appears to be empty or could not be parsed.');
        }
        if (errors.length > 0) {
          console.warn('CSV parsing warnings:', errors);
        }
        onDataLoaded(data, file.name);
        setSuccessMessage(`Loaded ${data.length} records from ${file.name}`);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const workbookInfo = await readExcelWorkbook(file);
        if (workbookInfo.sheets.length === 0) {
          throw new Error('Excel workbook contains no visible worksheets.');
        }

        setExcelWorkbook(workbookInfo);
        setAvailableSheets(workbookInfo.sheets);
        setActiveFileName(file.name);
        const defaultSheet = workbookInfo.defaultSheet;
        setSelectedSheet(defaultSheet);

        // Load the default sheet right away
        const rows = extractSheetData(workbookInfo.workbook, defaultSheet);
        if (rows.length === 0) {
          throw new Error(`Sheet "${defaultSheet}" has no records.`);
        }
        onDataLoaded(rows, `${file.name} [${defaultSheet}]`);
        setSuccessMessage(
          workbookInfo.sheets.length > 1
            ? `Workbook contains ${workbookInfo.sheets.length} sheets. Loaded "${defaultSheet}" (${rows.length} rows). You can select other sheets below.`
            : `Loaded ${rows.length} records from ${file.name}`
        );
      } else {
        throw new Error('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse file. Please verify file integrity.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!excelWorkbook) return;
    try {
      setSelectedSheet(sheetName);
      const rows = extractSheetData(excelWorkbook.workbook, sheetName);
      if (rows.length === 0) {
        setErrorMessage(`Sheet "${sheetName}" contains no records.`);
        return;
      }
      onDataLoaded(rows, `${activeFileName} [${sheetName}]`);
      setSuccessMessage(`Switched to sheet "${sheetName}" (${rows.length} records loaded).`);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(`Failed to switch to sheet "${sheetName}": ${err.message}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Card */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Upload dataset file"
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
            <UploadCloud className="w-8 h-8" aria-hidden="true" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">
            {isLoading ? 'Parsing dataset...' : 'Drag and drop your dataset here, or click to browse'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Supports CSV, XLSX, and XLS formats. Includes automatic column detection, currency symbol removal, and Excel date serial conversion.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              CSV (.csv)
            </span>
            <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-2xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel (.xlsx, .xls)
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Sheet Selector for Excel */}
      {availableSheets.length > 1 && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <div>
              <span className="text-xs font-semibold text-blue-900 block">Excel Workbook Sheet Selector</span>
              <span className="text-xs text-blue-700">
                This workbook contains {availableSheets.length} worksheets. Select which sheet to analyze:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSheet}
              onChange={e => handleSheetChange(e.target.value)}
              className="text-xs font-medium bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              aria-label="Select sheet to analyze"
            >
              {availableSheets.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} {s.rowCount > 0 ? `(~${s.rowCount} rows)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Alerts & Current Dataset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="text-slate-400">Current Dataset:</span>
          <span className="font-semibold text-slate-800">{currentFileName}</span>
        </div>

        <button
          onClick={onResetSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Restore standard 120-day sample retail sales data"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Reset to Sample Data</span>
        </button>
      </div>

      {/* Feedback messages */}
      {successMessage && (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
