import React from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Database, CheckCircle, AlertTriangle, Layers, RotateCcw } from 'lucide-react';
import { ColumnMapping } from '../types';

export const Schema: React.FC = () => {
  const {
    schema,
    mapping,
    updateMapping,
    rawRows,
    resetToSampleData,
  } = useAnalytics();

  const handleRoleChange = (columnName: string, role: string) => {
    const updated: Partial<ColumnMapping> = {};

    // Remove this column from any previous mapping
    if (mapping.dateColumn === columnName) updated.dateColumn = '';
    if (mapping.targetColumn === columnName) updated.targetColumn = '';
    if (mapping.categoryColumn === columnName) updated.categoryColumn = '';
    if (mapping.productColumn === columnName) updated.productColumn = '';

    // Assign to new role
    if (role === 'date') updated.dateColumn = columnName;
    else if (role === 'target') updated.targetColumn = columnName;
    else if (role === 'category') updated.categoryColumn = columnName;
    else if (role === 'product') updated.productColumn = columnName;

    updateMapping(updated);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Data Schema & Column Roles</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review the inferred schema and manually override column assignments for your time-series analysis and forecasting.
          </p>
        </div>

        <button
          onClick={resetToSampleData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Schema Mappings</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${mapping.dateColumn ? 'bg-white border-blue-200' : 'bg-amber-50/50 border-amber-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900">Date Column</span>
            <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
              Required
            </span>
          </div>
          <p className="text-2xs text-slate-500 mb-2">
            Timeline axis for sorting, cadence detection, and forecast projections.
          </p>
          <span className="text-xs font-semibold text-blue-700 font-mono block truncate">
            {mapping.dateColumn || '⚠️ Missing'}
          </span>
        </div>

        <div className={`p-4 rounded-xl border ${mapping.targetColumn ? 'bg-white border-blue-200' : 'bg-amber-50/50 border-amber-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900">Target Column</span>
            <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
              Required
            </span>
          </div>
          <p className="text-2xs text-slate-500 mb-2">
            Numerical metric to predict (revenue, sales, order quantity, price).
          </p>
          <span className="text-xs font-semibold text-blue-700 font-mono block truncate">
            {mapping.targetColumn || '⚠️ Missing'}
          </span>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900">Category Column</span>
            <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Optional
            </span>
          </div>
          <p className="text-2xs text-slate-500 mb-2">
            Department or category breakdown for comparative charts and filters.
          </p>
          <span className="text-xs font-semibold text-slate-700 font-mono block truncate">
            {mapping.categoryColumn || 'None'}
          </span>
        </div>

        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900">Product Column</span>
            <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Optional
            </span>
          </div>
          <p className="text-2xs text-slate-500 mb-2">
            Item names or SKUs used for granular SKU-level filtering.
          </p>
          <span className="text-xs font-semibold text-slate-700 font-mono block truncate">
            {mapping.productColumn || 'None'}
          </span>
        </div>
      </div>

      {/* Schema Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Column Schema Table</h3>
          <p className="text-xs text-slate-500">
            Detected types, data completeness, and interactive role assignment
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Detected Type</th>
                <th className="py-3 px-4">Required</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4 text-right">Unique Values</th>
                <th className="py-3 px-4 text-right">Missing</th>
                <th className="py-3 px-4">Sample Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schema.map(col => {
                const isSelected = col.selectedRole !== 'none';
                return (
                  <tr
                    key={col.name}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Column Name */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {col.name}
                    </td>

                    {/* Detected Type */}
                    <td className="py-3 px-4">
                      <span className="text-2xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {col.detectedType}
                      </span>
                    </td>

                    {/* Required */}
                    <td className="py-3 px-4">
                      {col.selectedRole === 'date' || col.selectedRole === 'target' ? (
                        <span className="text-2xs font-bold text-blue-700">YES</span>
                      ) : (
                        <span className="text-2xs text-slate-400">NO</span>
                      )}
                    </td>

                    {/* Assigned Role Override Selector */}
                    <td className="py-3 px-4">
                      <select
                        value={col.selectedRole}
                        onChange={e => handleRoleChange(col.name, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          col.selectedRole !== 'none'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="none">None (Not Used)</option>
                        <option value="date">Date Column (Timeline)</option>
                        <option value="target">Target Column (Metric)</option>
                        <option value="category">Category Column</option>
                        <option value="product">Product Column</option>
                      </select>
                    </td>

                    {/* Unique Values */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {col.uniqueCount.toLocaleString()}
                    </td>

                    {/* Missing Count */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {col.missingCount > 0 ? (
                        <span className="text-amber-600 font-semibold">{col.missingCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Sample */}
                    <td className="py-3 px-4 text-slate-500 truncate max-w-xs font-mono text-2xs">
                      {col.sampleValue || <span className="italic text-slate-300">empty</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
