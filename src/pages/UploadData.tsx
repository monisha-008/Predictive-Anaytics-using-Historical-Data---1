import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { UploadArea } from '../components/UploadArea';
import { DataTable } from '../components/DataTable';
import {
  FileCheck2,
  AlertTriangle,
  CopyX,
  FileQuestion,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';

export const UploadData: React.FC = () => {
  const {
    rawRows,
    fileName,
    cleanedRecords,
    qualityReport,
    mapping,
    loadNewDataset,
    resetToSampleData,
    setActiveTab,
  } = useAnalytics();

  const [previewTab, setPreviewTab] = useState<'cleaned' | 'raw'>('cleaned');

  const rawColumns = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const cleanedColumns = ['date', 'target', 'category', 'product'];

  const cleanedTableData = cleanedRecords.map(r => ({
    date: r.date || 'N/A',
    target: r.target !== undefined ? `$${r.target.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A',
    category: r.category || 'N/A',
    product: r.product || 'N/A',
  }));

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Upload & Prepare Historical Data</h2>
        <p className="text-xs text-slate-500 mt-1">
          Import your sales data in CSV or Excel format. Preprocessing automatically removes currency symbols, normalizes date formats, handles duplicate rows, and detects column schema.
        </p>
      </div>

      {/* Upload Box */}
      <UploadArea
        onDataLoaded={loadNewDataset}
        onResetSample={resetToSampleData}
        currentFileName={fileName}
      />

      {/* Preprocessing & Data Quality Audit Card */}
      {qualityReport && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900">Data Preprocessing & Quality Report</h3>
            </div>
            <button
              onClick={() => setActiveTab('schema')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <span>View Data Schema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">Total Rows</span>
              <span className="text-xl font-bold text-slate-800 font-mono tabular-nums">
                {qualityReport.totalRows.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="text-2xs font-semibold uppercase text-emerald-700 block mb-1">Valid Cleaned Rows</span>
              <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
                {qualityReport.validRows.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">Missing Values</span>
              <span className="text-xl font-bold text-slate-700 font-mono tabular-nums">
                {qualityReport.missingValues.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">Duplicate Rows</span>
              <span className="text-xl font-bold text-slate-700 font-mono tabular-nums">
                {qualityReport.duplicateRows.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-2xs font-semibold uppercase text-slate-400 block mb-1">Invalid Values</span>
              <span className="text-xl font-bold text-slate-700 font-mono tabular-nums">
                {qualityReport.invalidValues.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cleaning transformation log */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-700 block mb-2">Automated Transformations Applied</span>
            <ul className="text-xs text-slate-600 space-y-1">
              {qualityReport.cleaningLog.map((entry, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{entry}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-slate-500">
                <span className="text-blue-500 font-bold shrink-0">ℹ</span>
                <span>
                  Detected Columns: Date = <strong className="text-slate-700">{mapping.dateColumn || 'None'}</strong>, Target = <strong className="text-slate-700">{mapping.targetColumn || 'None'}</strong>, Category = <strong className="text-slate-700">{mapping.categoryColumn || 'None'}</strong>, Product = <strong className="text-slate-700">{mapping.productColumn || 'None'}</strong>.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Dataset Preview Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Dataset Table Preview</h3>
            <p className="text-xs text-slate-500">
              Inspect sanitized data records or switch to inspect raw uploaded values
            </p>
          </div>

          {/* Toggle between cleaned and raw */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setPreviewTab('cleaned')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                previewTab === 'cleaned' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cleaned Records ({cleanedRecords.length})
            </button>
            <button
              onClick={() => setPreviewTab('raw')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                previewTab === 'raw' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Dataset ({rawRows.length})
            </button>
          </div>
        </div>

        {previewTab === 'cleaned' ? (
          <DataTable
            columns={cleanedColumns}
            data={cleanedTableData}
            pageSize={10}
            highlightColumn="target"
            emptyMessage="No valid cleaned records found. Please check column mapping in the Data Schema tab."
          />
        ) : (
          <DataTable
            columns={rawColumns}
            data={rawRows}
            pageSize={10}
            emptyMessage="No raw dataset loaded. Upload a file or click Reset to Sample Data."
          />
        )}
      </div>
    </div>
  );
};
