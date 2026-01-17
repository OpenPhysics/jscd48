/**
 * Type definitions for CD48 analysis module
 */

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

export interface StatisticsSummary {
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  count: number;
}

export interface HistogramResult {
  bins: number[];
  counts: number[];
  edges: number[];
  binWidth: number;
}

export interface CumulativeHistogramResult extends HistogramResult {
  normalized: number[];
}

export interface HistogramOptions {
  bins?: number;
  min?: number;
  max?: number;
}

/**
 * Statistical analysis utilities for count data
 */
export const Statistics: {
  mean(data: number[]): number;
  median(data: number[]): number;
  standardDeviation(data: number[], sample?: boolean): number;
  variance(data: number[], sample?: boolean): number;
  poissonUncertainty(count: number): number;
  zScore(count1: number, count2: number): number;
  linearRegression(x: number[], y: number[]): LinearRegressionResult;
  summary(data: number[]): StatisticsSummary;
};

/**
 * Histogram generation utilities
 */
export const Histogram: {
  create(data: number[], options?: HistogramOptions): HistogramResult;
  autobin(data: number[]): HistogramResult;
  freedmanDiaconis(data: number[]): HistogramResult;
  cumulative(data: number[], options?: HistogramOptions): CumulativeHistogramResult;
};

/**
 * Time-series analysis helpers
 */
export const TimeSeries: {
  movingAverage(data: number[], window: number): number[];
  exponentialMovingAverage(data: number[], alpha?: number): number[];
  detectOutliers(data: number[], threshold?: number): number[];
  rateOfChange(data: number[], times?: number[] | null): number[];
  autocorrelation(data: number[], lag: number): number;
  resample(data: number[], times: number[], newTimes: number[]): number[];
  deadTimeCorrection(observedRate: number, deadTime: number): number;
};

/**
 * Coincidence analysis utilities
 */
export const Coincidence: {
  accidentalRate(rate1: number, rate2: number, coincidenceWindow: number): number;
  trueRate(measuredRate: number, rate1: number, rate2: number, coincidenceWindow: number): number;
  signalToNoise(trueRate: number, accidentalRate: number): number;
  optimalWindow(rate1: number, rate2: number, targetSNR?: number): number;
};

declare const _default: {
  Statistics: typeof Statistics;
  Histogram: typeof Histogram;
  TimeSeries: typeof TimeSeries;
  Coincidence: typeof Coincidence;
};
export default _default;
