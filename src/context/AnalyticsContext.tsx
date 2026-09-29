import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  RawRow,
  CleanedRecord,
  ColumnMapping,
  ColumnSchema,
  DataQualityReport,
  ForecastHorizon,
  PredictionModelType,
  ForecastResult,
  FilterState,
  Granularity,
} from '../types';
import { SAMPLE_DATA } from '../data/sampleData';
import { detectColumns } from '../utils/columnDetection';
import { cleanDataset } from '../utils/dataCleaning';
import { generateForecast } from '../utils/forecast';
import { detectGranularity, parseDate } from '../utils/dateUtils';
import { loadFromLocalStorage, saveToLocalStorage, clearLocalStorage } from '../utils/storage';

export interface KPIData {
  totalRecords: number;
  totalRevenue: number | null;
  averageRevenue: number | null;
  growthRate: number | null; // percentage or null for N/A
  forecastValue: number | null;
  detectedGranularity: Granularity;
  forecastPeriods: number;
}

interface AnalyticsContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Data & Schema
  rawRows: RawRow[];
  fileName: string;
  mapping: ColumnMapping;
  schema: ColumnSchema[];
  cleanedRecords: CleanedRecord[];
  filteredRecords: CleanedRecord[];
  qualityReport: DataQualityReport | null;

  // Filtering
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  availableCategories: string[];
  availableProducts: string[];
  minDate: string;
  maxDate: string;

  // Prediction Settings & State
  predictionModel: PredictionModelType;
  setPredictionModel: (model: PredictionModelType) => void;
  forecastHorizon: ForecastHorizon;
  setForecastHorizon: (horizon: ForecastHorizon) => void;
  movingAverageWindow: number;
  setMovingAverageWindow: (window: number) => void;
  forecastResult: ForecastResult | null;
  runPrediction: () => void;

  // Calculated KPIs
  kpis: KPIData;

  // Actions
  loadNewDataset: (rows: RawRow[], name: string) => void;
  updateMapping: (newMapping: Partial<ColumnMapping>) => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
  storageWarning: string | null;
  dismissStorageWarning: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Initialize from LocalStorage or Sample Data
  const [rawRows, setRawRows] = useState<RawRow[]>(() => {
    const saved = loadFromLocalStorage();
    if (saved?.rawRows && saved.rawRows.length > 0) {
      return saved.rawRows;
    }
    return SAMPLE_DATA;
  });

  const [fileName, setFileName] = useState<string>(() => {
    const saved = loadFromLocalStorage();
    return saved?.fileName || 'Sample Retail Sales (120 Days).csv';
  });

  // Model parameters
  const [predictionModel, setPredictionModel] = useState<PredictionModelType>(() => {
    const saved = loadFromLocalStorage();
    return (saved?.modelType as PredictionModelType) || 'linear_regression';
  });

  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>(() => {
    const saved = loadFromLocalStorage();
    return (saved?.horizonDays as ForecastHorizon) || 30;
  });

  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(() => {
    const saved = loadFromLocalStorage();
    return saved?.windowSize || 5;
  });

  // Auto-detect schema and mapping
  const { initialMapping, initialSchema } = useMemo(() => {
    const detected = detectColumns(rawRows);
    return { initialMapping: detected.mapping, initialSchema: detected.schema };
  }, [rawRows]);

  const [mapping, setMapping] = useState<ColumnMapping>(() => {
    const saved = loadFromLocalStorage();
    return saved?.mapping || initialMapping;
  });

  // Sync schema roles whenever mapping changes
  const schema = useMemo<ColumnSchema[]>(() => {
    return initialSchema.map(s => {
      let role: ColumnSchema['selectedRole'] = 'none';
      if (s.name === mapping.dateColumn) role = 'date';
      else if (s.name === mapping.targetColumn) role = 'target';
      else if (s.name === mapping.categoryColumn) role = 'category';
      else if (s.name === mapping.productColumn) role = 'product';

      return {
        ...s,
        selectedRole: role,
        isRequired: role === 'date' || role === 'target',
      };
    });
  }, [initialSchema, mapping]);

  // Clean data using current mapping
  const { cleaned: cleanedRecords, report: qualityReport } = useMemo(() => {
    if (!rawRows || rawRows.length === 0) {
      return {
        cleaned: [] as CleanedRecord[],
        report: {
          totalRows: 0,
          validRows: 0,
          missingValues: 0,
          duplicateRows: 0,
          invalidValues: 0,
          cleaningLog: ['No dataset loaded.'],
        } as DataQualityReport,
      };
    }
    return cleanDataset(rawRows, mapping);
  }, [rawRows, mapping]);

  // Available unique categories and products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const r of cleanedRecords) {
      if (r.category) cats.add(r.category);
    }
    return Array.from(cats).sort();
  }, [cleanedRecords]);

  const availableProducts = useMemo(() => {
    const prods = new Set<string>();
    for (const r of cleanedRecords) {
      if (r.product) prods.add(r.product);
    }
    return Array.from(prods).sort();
  }, [cleanedRecords]);

  // Date range bounds
  const { minDate, maxDate } = useMemo(() => {
    let min = '';
    let max = '';
    for (const r of cleanedRecords) {
      if (r.date) {
        if (!min || r.date < min) min = r.date;
        if (!max || r.date > max) max = r.date;
      }
    }
    return { minDate: min, maxDate: max };
  }, [cleanedRecords]);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    categories: [],
    products: [],
  });

  const resetFilters = useCallback(() => {
    setFilters({
      startDate: '',
      endDate: '',
      categories: [],
      products: [],
    });
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return cleanedRecords.filter((r: CleanedRecord) => {
      // Date range filter
      if (r.date) {
        if (filters.startDate && r.date < filters.startDate) return false;
        if (filters.endDate && r.date > filters.endDate) return false;
      }

      // Category filter
      if (filters.categories.length > 0 && r.category) {
        if (!filters.categories.includes(r.category)) return false;
      }

      // Product filter
      if (filters.products.length > 0 && r.product) {
        if (!filters.products.includes(r.product)) return false;
      }

      return true;
    });
  }, [cleanedRecords, filters]);

  // Forecast state
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  const runPrediction = useCallback(() => {
    if (filteredRecords.length === 0 || !mapping.targetColumn) {
      setForecastResult(null);
      return;
    }

    const result = generateForecast({
      records: filteredRecords,
      modelType: predictionModel,
      horizonDays: forecastHorizon,
      windowSize: movingAverageWindow,
    });

    setForecastResult(result);
  }, [filteredRecords, mapping.targetColumn, predictionModel, forecastHorizon, movingAverageWindow]);

  // Automatically recalculate forecast when parameters change
  useEffect(() => {
    runPrediction();
  }, [runPrediction]);

  // KPI Calculations
  const kpis = useMemo<KPIData>(() => {
    const records = filteredRecords;
    const totalRecords = records.length;

    // Detected Granularity
    const dates: Date[] = [];
    for (const r of records) {
      if (r.date) {
        const d = parseDate(r.date);
        if (d) dates.push(d);
      }
    }
    const detectedGranularity = detectGranularity(dates);
    const forecastPeriods = forecastResult ? forecastResult.forecastPeriods : 0;

    if (!mapping.targetColumn || records.length === 0) {
      return {
        totalRecords,
        totalRevenue: null,
        averageRevenue: null,
        growthRate: null,
        forecastValue: null,
        detectedGranularity,
        forecastPeriods,
      };
    }

    // Extract valid target numbers
    const validTargets: number[] = [];
    for (const r of records) {
      if (r.target !== undefined && !isNaN(r.target) && isFinite(r.target)) {
        validTargets.push(r.target);
      }
    }

    if (validTargets.length === 0) {
      return {
        totalRecords,
        totalRevenue: null,
        averageRevenue: null,
        growthRate: null,
        forecastValue: null,
        detectedGranularity,
        forecastPeriods,
      };
    }

    // Total Revenue
    const totalRevenue = validTargets.reduce((sum, v) => sum + v, 0);

    // Average Revenue
    const averageRevenue = totalRevenue / validTargets.length;

    // Growth Rate = ((Latest Value - Previous Value) / Previous Value) * 100
    // If not enough valid data or Previous Value = 0: N/A
    let growthRate: number | null = null;
    if (validTargets.length >= 2) {
      const latest = validTargets[validTargets.length - 1];
      const previous = validTargets[validTargets.length - 2];
      if (previous !== 0 && isFinite(previous) && isFinite(latest)) {
        growthRate = Number((((latest - previous) / previous) * 100).toFixed(2));
      }
    }

    // Forecast Value: first forecasted value generated by selected prediction model
    const forecastValue = forecastResult?.firstForecastValue ?? null;

    return {
      totalRecords,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageRevenue: Number(averageRevenue.toFixed(2)),
      growthRate,
      forecastValue,
      detectedGranularity,
      forecastPeriods,
    };
  }, [filteredRecords, mapping.targetColumn, forecastResult]);

  // Persist to LocalStorage
  useEffect(() => {
    const saveRes = saveToLocalStorage({
      rawRows,
      fileName,
      mapping,
      modelType: predictionModel,
      horizonDays: forecastHorizon,
      windowSize: movingAverageWindow,
    });

    if (!saveRes.success && saveRes.error) {
      setStorageWarning(saveRes.error);
    } else {
      setStorageWarning(null);
    }
  }, [rawRows, fileName, mapping, predictionModel, forecastHorizon, movingAverageWindow]);

  // Actions
  const loadNewDataset = useCallback((rows: RawRow[], name: string) => {
    setRawRows(rows);
    setFileName(name);
    const detected = detectColumns(rows);
    setMapping(detected.mapping);
    setFilters({
      startDate: '',
      endDate: '',
      categories: [],
      products: [],
    });
  }, []);

  const updateMapping = useCallback((newMapping: Partial<ColumnMapping>) => {
    setMapping(prev => ({
      ...prev,
      ...newMapping,
    }));
  }, []);

  const resetToSampleData = useCallback(() => {
    clearLocalStorage();
    setRawRows(SAMPLE_DATA);
    setFileName('Sample Retail Sales (120 Days).csv');
    const detected = detectColumns(SAMPLE_DATA);
    setMapping(detected.mapping);
    setPredictionModel('linear_regression');
    setForecastHorizon(30);
    setMovingAverageWindow(5);
    setFilters({
      startDate: '',
      endDate: '',
      categories: [],
      products: [],
    });
    setStorageWarning(null);
  }, []);

  const clearAllData = useCallback(() => {
    clearLocalStorage();
    setRawRows([]);
    setFileName('Empty Dataset');
    setMapping({
      dateColumn: '',
      targetColumn: '',
      categoryColumn: '',
      productColumn: '',
    });
    setForecastResult(null);
    resetFilters();
  }, [resetFilters]);

  const dismissStorageWarning = useCallback(() => {
    setStorageWarning(null);
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        rawRows,
        fileName,
        mapping,
        schema,
        cleanedRecords,
        filteredRecords,
        qualityReport,
        filters,
        setFilters,
        resetFilters,
        availableCategories,
        availableProducts,
        minDate,
        maxDate,
        predictionModel,
        setPredictionModel,
        forecastHorizon,
        setForecastHorizon,
        movingAverageWindow,
        setMovingAverageWindow,
        forecastResult,
        runPrediction,
        kpis,
        loadNewDataset,
        updateMapping,
        resetToSampleData,
        clearAllData,
        storageWarning,
        dismissStorageWarning,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
