/**
 * Moving Average predictive model implementation.
 *
 * Computes a rolling average of window size k over historical observations.
 * For future forecasting: applies iterative multi-step moving average forecasting,
 * taking the average of the most recent k periods (including previously forecasted points).
 */

export interface MovingAverageResult {
  windowSize: number;
  inSampleFitted: (number | null)[];
  forecast: (periods: number) => number[];
}

/**
 * Calculates in-sample moving averages and provides a future forecast generator.
 */
export function fitMovingAverage(values: number[], windowSize: number = 3): MovingAverageResult | null {
  const n = values.length;
  if (n < 1) {
    return null;
  }

  // Ensure window size is at least 1 and does not exceed dataset length
  const effectiveWindow = Math.max(1, Math.min(windowSize, n));

  // Compute in-sample moving average
  const inSampleFitted: (number | null)[] = [];

  for (let i = 0; i < n; i++) {
    if (i < effectiveWindow - 1) {
      // Not enough preceding points for a full window
      // We can compute expanding average for early points so charts have smooth curves
      let sum = 0;
      for (let j = 0; j <= i; j++) {
        sum += values[j];
      }
      inSampleFitted.push(sum / (i + 1));
    } else {
      let sum = 0;
      for (let j = i - effectiveWindow + 1; j <= i; j++) {
        sum += values[j];
      }
      inSampleFitted.push(sum / effectiveWindow);
    }
  }

  // Multi-step future forecast
  const forecast = (periods: number): number[] => {
    const futureValues: number[] = [];
    // Copy the tail of the series
    const rollingSeries = [...values];

    for (let step = 0; step < periods; step++) {
      const slice = rollingSeries.slice(-effectiveWindow);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const cleanAvg = Math.max(0, avg);
      futureValues.push(cleanAvg);
      rollingSeries.push(cleanAvg);
    }

    return futureValues;
  };

  return {
    windowSize: effectiveWindow,
    inSampleFitted,
    forecast,
  };
}
