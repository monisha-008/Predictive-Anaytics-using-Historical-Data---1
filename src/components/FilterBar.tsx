import React from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Filter, RotateCcw, Calendar, Tag, Package } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const {
    mapping,
    filters,
    setFilters,
    resetFilters,
    availableCategories,
    availableProducts,
    cleanedRecords,
    filteredRecords,
    minDate,
    maxDate,
  } = useAnalytics();

  const hasDate = Boolean(mapping.dateColumn);
  const hasCategory = Boolean(mapping.categoryColumn && availableCategories.length > 0);
  const hasProduct = Boolean(mapping.productColumn && availableProducts.length > 0);

  // If no filters can be shown, don't render empty container
  if (!hasDate && !hasCategory && !hasProduct) {
    return null;
  }

  const isFilterActive =
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.categories.length > 0 ||
    filters.products.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Count */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Filters</span>
          <span className="text-xs text-slate-500 tabular-nums">
            (Showing {filteredRecords.length} of {cleanedRecords.length} records)
          </span>
        </div>

        {/* Reset button */}
        {isFilterActive && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="Clear all active filters"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {/* Date Range Filter (only if date column exists) */}
        {hasDate && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Date Range</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.startDate}
                min={minDate}
                max={filters.endDate || maxDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="Start Date Filter"
              />
              <input
                type="date"
                value={filters.endDate}
                min={filters.startDate || minDate}
                max={maxDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label="End Date Filter"
              />
            </div>
          </div>
        )}

        {/* Category Filter (only if category column exists) */}
        {hasCategory && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Category</span>
            </label>
            <select
              value={filters.categories[0] || ''}
              onChange={e => {
                const val = e.target.value;
                setFilters(prev => ({
                  ...prev,
                  categories: val ? [val] : [],
                }));
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Filter by Category"
            >
              <option value="">All Categories ({availableCategories.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Filter (only if product column exists) */}
        {hasProduct && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Product</span>
            </label>
            <select
              value={filters.products[0] || ''}
              onChange={e => {
                const val = e.target.value;
                setFilters(prev => ({
                  ...prev,
                  products: val ? [val] : [],
                }));
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Filter by Product"
            >
              <option value="">All Products ({availableProducts.length})</option>
              {availableProducts.map(prod => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
