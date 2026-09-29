import {
  CleanedRecord,
  ForecastHorizon,
  PredictionModelType,
  ForecastResult,
  ForecastPoint,
  ActualVsPredictedPoint,
  Granularity,
} from '../types';
import { detectGranularity, convertHorizonToPeriods, addPeriodsToDate, parseDate, formatDateISO } from './dateUtils';
import { fitLinearRegression } from './regression';
import { fitMovingAverage } from './movingAverage';
import { evaluateModel } from './evaluation';

export interface GenerateForecastParams {
  records: CleanedRecord[];
  modelType: PredictionModelType;
  horizonDays: ForecastHorizon;
  windowSize?: number;
}

/**
 * Generates predictions and comprehensive time-series diagnostics.
 */
export function generateForecast({
  records,
  modelType,
  horizonDays,
  windowSize = 3,
}: GenerateForecastParams): ForecastResult | null {
  // Filter records that have valid target numbers
  const validRecords = records.filter(r => r.target !== undefined && !isNaN(r.target) && isFinite(r.target));
  if (validRecords.length < 2) {
    return null;
  }

  const values = validRecords.map(r => r.target as number);

  // Extract dates for granularity detection
  const dates: Date[] = [];
  for (const r of validRecords) {
    if (r.date) {
      const d = parseDate(r.date);
      if (d) dates.push(d);
    }
  }

  const granularity: Granularity = detectGranularity(dates);
  const forecastPeriods = convertHorizonToPeriods(horizonDays, granularity);

  // Run 80/20 evaluation
  const metrics = evaluateModel(values, modelType, windowSize);

  // Find the last known date
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : new Date();

  // Generate model fits
  let futureValues: number[] = [];
  let inSampleFitted: (number | null)[] = [];
  let slope: number | undefined;
  let intercept: number | undefined;

  if (modelType === 'linear_regression') {
    const reg = fitLinearRegression(values);
    if (!reg) return null;
    futureValues = reg.forecast(forecastPeriods);
    inSampleFitted = reg.inSampleFitted;
    slope = reg.slope;
    intercept = reg.intercept;
  } else {
    const ma = fitMovingAverage(values, windowSize);
    if (!ma) return null;
    futureValues = ma.forecast(forecastPeriods);
    inSampleFitted = ma.inSampleFitted;
  }

  // Construct forecast points
  const forecastPoints: ForecastPoint[] = [];
  for (let i = 0; i < futureValues.length; i++) {
    const step = i + 1;
    const futureDateObj = addPeriodsToDate(lastDate, step, granularity);
    const dateStr = formatDateISO(futureDateObj);
    const val = Number(futureValues[i].toFixed(2));

    forecastPoints.push({
      periodIndex: step,
      periodLabel: `Period +${step} (${granularity})`,
      date: dateStr,
      predictedValue: isFinite(val) ? val : 0,
    });
  }

  // Construct combined Actual vs Predicted points for charts
  const actualVsPredicted: ActualVsPredictedPoint[] = [];

  // Historical points
  const splitIndex = Math.floor(values.length * 0.8);
  for (let i = 0; i < values.length; i++) {
    const r = validRecords[i];
    const dateLabel = r.date || `T-${values.length - i}`;
    const actualVal = values[i];
    const fittedVal = inSampleFitted[i] !== null && inSampleFitted[i] !== undefined
      ? Number(inSampleFitted[i]!.toFixed(2))
      : null;

    actualVsPredicted.push({
      index: i,
      date: dateLabel,
      actual: actualVal,
      predicted: fittedVal,
      forecast: null,
      type: i < splitIndex ? 'train' : 'test',
    });
  }

  // Add seamless bridge point so chart line connects
  if (actualVsPredicted.length > 0 && forecastPoints.length > 0) {
    const lastHistorical = actualVsPredicted[actualVsPredicted.length - 1];
    lastHistorical.forecast = lastHistorical.actual;
  }

  // Future points
  for (let i = 0; i < forecastPoints.length; i++) {
    const fp = forecastPoints[i];
    actualVsPredicted.push({
      index: values.length + i,
      date: fp.date,
      actual: null,
      predicted: null,
      forecast: fp.predictedValue,
      type: 'future',
    });
  }

  // Compute key summary statistics
  const firstForecastValue = forecastPoints.length > 0 ? forecastPoints[0].predictedValue : null;

  const sumForecast = forecastPoints.reduce((acc, p) => acc + p.predictedValue, 0);
  const averageForecastValue = forecastPoints.length > 0
    ? Number((sumForecast / forecastPoints.length).toFixed(2))
    : null;

  // Trend direction: compare average forecast with historical average
  const histAvg = values.reduce((a, b) => a + b, 0) / values.length;
  let trendDirection: 'Upward' | 'Downward' | 'Stable' = 'Stable';
  let trendPercent = 0;

  if (averageForecastValue !== null && histAvg > 0) {
    trendPercent = Number((((averageForecastValue - histAvg) / histAvg) * 100).toFixed(1));
    if (trendPercent > 1) {
      trendDirection = 'Upward';
    } else if (trendPercent < -1) {
      trendDirection = 'Downward';
    } else {
      trendDirection = 'Stable';
    }
  }

  return {
    model: modelType,
    horizonDays,
    forecastPeriods,
    granularity,
    forecastPoints,
    actualVsPredicted,
    metrics,
    firstForecastValue,
    averageForecastValue,
    trendDirection,
    trendPercent,
    slope,
    intercept,
    windowSize: modelType === 'moving_average' ? windowSize : undefined,
  };
}
