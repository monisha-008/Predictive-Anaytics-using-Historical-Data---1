import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  data: Record<string, any>[];
  pageSize?: number;
  highlightColumn?: string;
  emptyMessage?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  pageSize = 10,
  highlightColumn,
  emptyMessage = 'No records found.',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numeric comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }

      // String comparison
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortColumn, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIdx, startIdx + pageSize);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  };

  if (columns.length === 0 || data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-slate-400">#</th>
              {columns.map(col => {
                const isHighlighted = col === highlightColumn;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className={`py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors whitespace-nowrap ${
                      isHighlighted ? 'bg-blue-50/50 text-blue-700 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((row, idx) => {
              const rowIndex = startIdx + idx + 1;
              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400 font-mono tabular-nums">{rowIndex}</td>
                  {columns.map(col => {
                    const rawVal = row[col];
                    const isNum = typeof rawVal === 'number' || (!isNaN(Number(rawVal)) && rawVal !== '');
                    const isHighlighted = col === highlightColumn;

                    return (
                      <td
                        key={col}
                        className={`py-2.5 px-4 whitespace-nowrap text-slate-700 ${
                          isHighlighted ? 'bg-blue-50/20 font-medium' : ''
                        } ${isNum ? 'text-right font-mono tabular-nums' : 'text-left'}`}
                      >
                        {rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== ''
                          ? typeof rawVal === 'number'
                            ? rawVal.toLocaleString('en-US', { maximumFractionDigits: 2 })
                            : String(rawVal)
                          : <span className="text-slate-300 italic">null</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span>
            Showing <strong className="font-semibold text-slate-900 tabular-nums">{startIdx + 1}</strong> to{' '}
            <strong className="font-semibold text-slate-900 tabular-nums">
              {Math.min(startIdx + pageSize, sortedData.length)}
            </strong>{' '}
            of <strong className="font-semibold text-slate-900 tabular-nums">{sortedData.length}</strong> entries
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safePage === 1}
            aria-label="First page"
            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-medium text-slate-700 tabular-nums">
            Page {safePage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage === totalPages}
            aria-label="Last page"
            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
