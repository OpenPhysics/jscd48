/**
 * @fileoverview TypeScript definitions for advanced statistical analysis tools
 * @module analysis
 */

/**
 * Statistical summary result
 */
export interface StatsSummary {
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Linear regression result
 */
export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

/**
 * Statistical analysis utilities for count data
 */
export namespace Statistics {
  /**
   * Calculate mean (average) of an array of numbers
   */
  export function mean(data: number[]): number;

  /**
   * Calculate median of an array of numbers
   */
  export function median(data: number[]): number;

  /**
   * Calculate standard deviation
   */
  export function standardDeviation(data: number[], sample?: boolean): number;

  /**
   * Calculate variance
   */
  export function variance(data: number[], sample?: boolean): number;

  /**
   * Calculate Poisson uncertainty (sqrt(N))
   */
  export function poissonUncertainty(count: number): number;

  /**
   * Calculate statistical significance between two count rates
   */
  export function zScore(count1: number, count2: number): number;

  /**
   * Perform linear regression on time-series data
   */
  export function linearRegression(x: number[], y: number[]): RegressionResult;

  /**
   * Calculate all basic statistics for a dataset
   */
  export function summary(data: number[]): StatsSummary;
}

/**
 * Histogram result
 */
export interface HistogramResult {
  bins: number[];
  counts: number[];
  edges: number[];
  binWidth: number;
}

/**
 * Cumulative histogram result
 */
export interface CumulativeHistogramResult extends HistogramResult {
  normalized: number[];
}

/**
 * Histogram options
 */
export interface HistogramOptions {
  bins?: number;
  min?: number;
  max?: number;
}

/**
 * Histogram generation utilities
 */
export namespace Histogram {
  /**
   * Create a histogram from data
   */
  export function create(data: number[], options?: HistogramOptions): HistogramResult;

  /**
   * Create histogram with automatic binning using Sturges' rule
   */
  export function autobin(data: number[]): HistogramResult;

  /**
   * Create histogram with Freedman-Diaconis rule for bin width
   */
  export function freedmanDiaconis(data: number[]): HistogramResult;

  /**
   * Calculate cumulative histogram
   */
  export function cumulative(data: number[], options?: HistogramOptions): CumulativeHistogramResult;
}

/**
 * Time-series analysis helpers
 */
export namespace TimeSeries {
  /**
   * Calculate moving average
   */
  export function movingAverage(data: number[], window: number): number[];

  /**
   * Calculate exponential moving average
   */
  export function exponentialMovingAverage(data: number[], alpha?: number): number[];

  /**
   * Detect outliers using z-score method
   */
  export function detectOutliers(data: number[], threshold?: number): number[];

  /**
   * Calculate rate of change
   */
  export function rateOfChange(data: number[], times?: number[] | null): number[];

  /**
   * Calculate autocorrelation
   */
  export function autocorrelation(data: number[], lag: number): number;

  /**
   * Resample time series data
   */
  export function resample(data: number[], times: number[], newTimes: number[]): number[];

  /**
   * Calculate dead time correction
   */
  export function deadTimeCorrection(observedRate: number, deadTime: number): number;
}

/**
 * Coincidence analysis utilities
 */
export namespace Coincidence {
  /**
   * Calculate expected accidental coincidence rate
   */
  export function accidentalRate(rate1: number, rate2: number, coincidenceWindow: number): number;

  /**
   * Calculate true coincidence rate
   */
  export function trueRate(
    measuredRate: number,
    rate1: number,
    rate2: number,
    coincidenceWindow: number
  ): number;

  /**
   * Calculate signal-to-noise ratio
   */
  export function signalToNoise(trueRate: number, accidentalRate: number): number;

  /**
   * Calculate optimal coincidence window
   */
  export function optimalWindow(rate1: number, rate2: number, targetSNR?: number): number;
}

declare const _default: {
  Statistics: typeof Statistics;
  Histogram: typeof Histogram;
  TimeSeries: typeof TimeSeries;
  Coincidence: typeof Coincidence;
};

export default _default;
