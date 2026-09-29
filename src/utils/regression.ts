/**
 * Linear Regression implementation using Ordinary Least Squares (OLS).
 * Equation: y = mx + b
 *
 * x: Time index (0, 1, 2, ..., n-1)
 * y: Metric value (e.g. revenue, sales)
 */

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
  inSampleFitted: number[];
  forecast: (periods: number) => number[];
}

/**
 * Fits a linear regression model on given numeric array.
 * If data length < 2 or variance in x is 0, returns null.
 */
export function fitLinearRegression(values: number[]): LinearRegressionResult | null {
  const n = values.length;
  if (n < 2) {
    return null;
  }

  // Calculate means of x and y
  // x_i = i, where i is 0, 1, 2, ..., n-1
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate covariance(x, y) and variance(x)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    const dy = values[i] - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  if (denominator === 0) {
    return null;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  const predict = (x: number): number => {
    return slope * x + intercept;
  };

  const inSampleFitted = values.map((_, i) => predict(i));

  const forecast = (periods: number): number[] => {
    const futureValues: number[] = [];
    for (let step = 0; step < periods; step++) {
      const futureIndex = n + step;
      // Do not allow negative forecast values if historical values are non-negative
      const rawPred = predict(futureIndex);
      futureValues.push(Math.max(0, rawPred));
    }
    return futureValues;
  };

  return {
    slope,
    intercept,
    predict,
    inSampleFitted,
    forecast,
  };
}
