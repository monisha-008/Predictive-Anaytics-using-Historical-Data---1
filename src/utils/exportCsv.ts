import { ForecastPoint } from '../types';

/**
 * Generates and triggers download of a CSV file containing the forecast points.
 */
export function exportForecastToCsv(
  points: ForecastPoint[],
  filename: string = 'forecast_results.csv'
): void {
  if (points.length === 0) return;

  const headers = ['Period Index', 'Period Label', 'Projected Date', 'Predicted Value'];
  const rows = points.map(p => [
    p.periodIndex,
    `"${p.periodLabel.replace(/"/g, '""')}"`,
    p.date,
    p.predictedValue.toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
