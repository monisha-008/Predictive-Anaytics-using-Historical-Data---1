export type Granularity = 'Daily' | 'Weekly' | 'Monthly';

export type ForecastHorizon = 7 | 30 | 90;

export type PredictionModelType = 'linear_regression' | 'moving_average';

export interface ColumnMapping {
  dateColumn: string;
  targetColumn: string;
  categoryColumn: string;
  productColumn: string;
}

export type DetectedDataType = 'date' | 'number' | 'string' | 'boolean' | 'unknown';

export interface ColumnSchema {
  name: string;
  detectedType: DetectedDataType;
  sampleValue: string;
  uniqueCount: number;
  missingCount: number;
  totalCount: number;
  isRequired: boolean;
  selectedRole: 'date' | 'target' | 'category' | 'product' | 'none';
}

export interface RawRow {
  [key: string]: any;
}

export interface CleanedRecord {
  _id: string;
  date?: string; // ISO string YYYY-MM-DD
  timestamp?: number;
  target?: number; // target metric (revenue, sales, etc.)
  category?: string;
  product?: string;
  raw: Record<string, any>;
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  missingValues: number;
  duplicateRows: number;
  invalidValues: number;
  cleaningLog: string[];
}

export interface ModelMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  accuracyLabel: 'High explanatory fit' | 'Moderate explanatory fit' | 'Low explanatory fit' | 'Poor explanatory fit' | 'N/A';
  trainCount: number;
  testCount: number;
  sufficientData: boolean;
  message?: string;
}

export interface ForecastPoint {
  periodIndex: number;
  periodLabel: string;
  date: string;
  predictedValue: number;
}

export interface ActualVsPredictedPoint {
  index: number;
  date: string;
  actual?: number | null;
  predicted?: number | null;
  forecast?: number | null;
  type: 'train' | 'test' | 'future';
}

export interface ForecastResult {
  model: PredictionModelType;
  horizonDays: ForecastHorizon;
  forecastPeriods: number;
  granularity: Granularity;
  forecastPoints: ForecastPoint[];
  actualVsPredicted: ActualVsPredictedPoint[];
  metrics: ModelMetrics;
  firstForecastValue: number | null;
  averageForecastValue: number | null;
  trendDirection: 'Upward' | 'Downward' | 'Stable';
  trendPercent: number;
  slope?: number;
  intercept?: number;
  windowSize?: number;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  categories: string[];
  products: string[];
}

export interface SheetInfo {
  name: string;
  rowCount: number;
}
