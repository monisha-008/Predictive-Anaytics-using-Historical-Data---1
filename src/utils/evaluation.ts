import { ModelMetrics, PredictionModelType } from '../types';
import { fitLinearRegression } from './regression';
import { fitMovingAverage } from './movingAverage';

/**
 * Evaluates a predictive model using an 80/20 CHRONOLOGICAL train-test split.
 * In time-series forecasting, chronological ordering must always be preserved.
 *
 * Training: First 80% of ordered points
 * Testing: Last 20% of ordered points
 */
export function evaluateModel(
  values: number[],
  modelType: PredictionModelType,
  windowSize: number = 3
): ModelMetrics {
  const n = values.length;

  // Minimum threshold: need at least 5 points to allow at least 4 train, 1 test
  if (n < 5) {
    return {
      mae: 0,
      mse: 0,
      rmse: 0,
      r2: 0,
      accuracyLabel: 'N/A',
      trainCount: 0,
      testCount: 0,
      sufficientData: false,
      message: 'Insufficient data for reliable model evaluation. At least 5 historical observations are required for an 80/20 chronological split.',
    };
  }

  const splitIndex = Math.floor(n * 0.8);
  const train = values.slice(0, splitIndex);
  const test = values.slice(splitIndex);

  if (train.length < 2 || test.length < 1) {
    return {
      mae: 0,
      mse: 0,
      rmse: 0,
      r2: 0,
      accuracyLabel: 'N/A',
      trainCount: train.length,
      testCount: test.length,
      sufficientData: false,
      message: 'Insufficient data for reliable model evaluation.',
    };
  }

  // Generate test predictions based on training data
  let testPredictions: number[] = [];

  if (modelType === 'linear_regression') {
    const regModel = fitLinearRegression(train);
    if (!regModel) {
      return {
        mae: 0,
        mse: 0,
        rmse: 0,
        r2: 0,
        accuracyLabel: 'N/A',
        trainCount: train.length,
        testCount: test.length,
        sufficientData: false,
        message: 'Could not compute linear regression for evaluation.',
      };
    }
    // Predict test points by projecting future x indices from train: train.length + i
    testPredictions = test.map((_, i) => regModel.predict(train.length + i));
  } else {
    // Moving Average: test predictions using forecast from train
    const maModel = fitMovingAverage(train, windowSize);
    if (!maModel) {
      return {
        mae: 0,
        mse: 0,
        rmse: 0,
        r2: 0,
        accuracyLabel: 'N/A',
        trainCount: train.length,
        testCount: test.length,
        sufficientData: false,
        message: 'Could not compute moving average for evaluation.',
      };
    }
    testPredictions = maModel.forecast(test.length);
  }

  // Calculate MAE, MSE, RMSE, R²
  const testN = test.length;
  let sumAbsError = 0;
  let sumSquaredResiduals = 0; // SS_res

  // Calculate mean of test set for SS_tot
  const meanTest = test.reduce((a, b) => a + b, 0) / testN;
  let totalSumOfSquares = 0; // SS_tot

  for (let i = 0; i < testN; i++) {
    const actual = test[i];
    const predicted = testPredictions[i];
    const error = actual - predicted;

    sumAbsError += Math.abs(error);
    sumSquaredResiduals += error * error;
    totalSumOfSquares += (actual - meanTest) * (actual - meanTest);
  }

  const mae = sumAbsError / testN;
  const mse = sumSquaredResiduals / testN;
  const rmse = Math.sqrt(mse);

  // R² formula: 1 - (SS_res / SS_tot)
  let r2 = 0;
  if (totalSumOfSquares > 0) {
    r2 = 1 - (sumSquaredResiduals / totalSumOfSquares);
  } else {
    // If variance is 0, test set is constant
    r2 = sumSquaredResiduals === 0 ? 1 : 0;
  }

  // Determine accuracy label
  let accuracyLabel: ModelMetrics['accuracyLabel'] = 'Poor explanatory fit';
  if (r2 >= 0.80) {
    accuracyLabel = 'High explanatory fit';
  } else if (r2 >= 0.60) {
    accuracyLabel = 'Moderate explanatory fit';
  } else if (r2 >= 0) {
    accuracyLabel = 'Low explanatory fit';
  } else {
    accuracyLabel = 'Poor explanatory fit';
  }

  return {
    mae: Number(mae.toFixed(2)),
    mse: Number(mse.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    r2: Number(r2.toFixed(4)),
    accuracyLabel,
    trainCount: train.length,
    testCount: test.length,
    sufficientData: true,
  };
}
