/**
 * @fileoverview Advanced statistical analysis tools for CD48 data
 * @module analysis
 */

import {
  DEFAULT_HISTOGRAM_BINS,
  OUTLIER_Z_SCORE_THRESHOLD,
  EXPONENTIAL_MA_DEFAULT_ALPHA,
  DEFAULT_TARGET_SNR,
  QUARTILE_Q1,
  QUARTILE_Q3,
  FREEDMAN_DIACONIS_DIVISOR,
} from './constants.js';

/**
 * Linear regression result
 */
export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

/**
 * Statistical summary result
 */
export interface StatisticalSummary {
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  count: number;
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
 * Statistical analysis utilities for count data
 */
export const Statistics = {
  /**
   * Calculate mean (average) of an array of numbers
   * @param data - Array of numeric values
   * @returns Mean value
   */
  mean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  },

  /**
   * Calculate median of an array of numbers
   * @param data - Array of numeric values
   * @returns Median value
   */
  median(data: number[]): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);
  },

  /**
   * Calculate standard deviation
   * @param data - Array of numeric values
   * @param sample - Use sample standard deviation (n-1)
   * @returns Standard deviation
   */
  standardDeviation(data: number[], sample = true): number {
    if (data.length === 0) return 0;
    if (data.length === 1) return 0;
    const avg = this.mean(data);
    const squareDiffs = data.map((value) => Math.pow(value - avg, 2));
    const divisor = sample ? data.length - 1 : data.length;
    const avgSquareDiff =
      squareDiffs.reduce((sum, val) => sum + val, 0) / divisor;
    return Math.sqrt(avgSquareDiff);
  },

  /**
   * Calculate variance
   * @param data - Array of numeric values
   * @param sample - Use sample variance (n-1)
   * @returns Variance
   */
  variance(data: number[], sample = true): number {
    const std = this.standardDeviation(data, sample);
    return std * std;
  },

  /**
   * Calculate Poisson uncertainty (sqrt(N))
   * @param count - Count value
   * @returns Poisson uncertainty
   */
  poissonUncertainty(count: number): number {
    return Math.sqrt(Math.max(0, count));
  },

  /**
   * Calculate statistical significance between two count rates
   * @param count1 - First count
   * @param count2 - Second count
   * @returns Z-score
   */
  zScore(count1: number, count2: number): number {
    const uncertainty = Math.sqrt(count1 + count2);
    if (uncertainty === 0) return 0;
    return Math.abs(count1 - count2) / uncertainty;
  },

  /**
   * Perform linear regression on time-series data
   * @param x - X values (e.g., time)
   * @param y - Y values (e.g., counts)
   * @returns Regression results
   */
  linearRegression(x: number[], y: number[]): LinearRegressionResult {
    if (x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, r2: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * (y[i] ?? 0), 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
      return { slope: 0, intercept: 0, r2: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = sumYY - n * yMean * yMean;
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * (x[i] ?? 0) + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

    return { slope, intercept, r2 };
  },

  /**
   * Calculate all basic statistics for a dataset
   * @param data - Array of numeric values
   * @returns Object containing mean, median, std, variance, min, max
   */
  summary(data: number[]): StatisticalSummary {
    if (data.length === 0) {
      return {
        mean: 0,
        median: 0,
        std: 0,
        variance: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    return {
      mean: this.mean(data),
      median: this.median(data),
      std: this.standardDeviation(data),
      variance: this.variance(data),
      min: Math.min(...data),
      max: Math.max(...data),
      count: data.length,
    };
  },
};

/**
 * Histogram generation utilities
 */
export const Histogram = {
  /**
   * Create a histogram from data
   * @param data - Array of numeric values
   * @param options - Histogram options
   * @returns Histogram data with bins, counts, and edges
   */
  create(data: number[], options: HistogramOptions = {}): HistogramResult {
    if (data.length === 0) {
      return { bins: [], counts: [], edges: [], binWidth: 0 };
    }

    const numBins = options.bins ?? DEFAULT_HISTOGRAM_BINS;
    const min = options.min ?? Math.min(...data);
    const max = options.max ?? Math.max(...data);
    const binWidth = (max - min) / numBins;

    if (binWidth === 0) {
      return {
        bins: [min],
        counts: [data.length],
        edges: [min, min],
        binWidth: 0,
      };
    }

    const counts: number[] = Array.from({ length: numBins }, () => 0);
    const edges: number[] = Array.from(
      { length: numBins + 1 },
      (_, i) => min + i * binWidth
    );

    // Count values in each bin
    data.forEach((value) => {
      if (value < min || value > max) return;
      let binIndex = Math.floor((value - min) / binWidth);
      if (binIndex === numBins) binIndex = numBins - 1; // Handle max value
      const currentCount = counts[binIndex];
      if (currentCount !== undefined) {
        counts[binIndex] = currentCount + 1;
      }
    });

    // Calculate bin centers
    const binCenters = edges.slice(0, -1).map((edge) => edge + binWidth / 2);

    return {
      bins: binCenters,
      counts,
      edges,
      binWidth,
    };
  },

  /**
   * Create histogram with automatic binning using Sturges' rule
   * @param data - Array of numeric values
   * @returns Histogram data
   */
  autobin(data: number[]): HistogramResult {
    if (data.length === 0) {
      return this.create([], {});
    }
    const bins = Math.ceil(Math.log2(data.length) + 1);
    return this.create(data, { bins });
  },

  /**
   * Create histogram with Freedman-Diaconis rule for bin width
   * @param data - Array of numeric values
   * @returns Histogram data
   */
  freedmanDiaconis(data: number[]): HistogramResult {
    if (data.length === 0) {
      return this.create([], {});
    }

    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * QUARTILE_Q1);
    const q3Index = Math.floor(sorted.length * QUARTILE_Q3);
    const q1 = sorted[q1Index] ?? 0;
    const q3 = sorted[q3Index] ?? 0;
    const iqr = q3 - q1;

    const binWidth =
      (2 * iqr) / Math.pow(data.length, FREEDMAN_DIACONIS_DIVISOR);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const calculatedBins = Math.ceil((max - min) / binWidth);
    const bins =
      binWidth === 0
        ? 1
        : calculatedBins !== 0 && !isNaN(calculatedBins)
          ? calculatedBins
          : 1;

    return this.create(data, { bins, min, max });
  },

  /**
   * Calculate cumulative histogram
   * @param data - Array of numeric values
   * @param options - Histogram options
   * @returns Cumulative histogram data
   */
  cumulative(
    data: number[],
    options: HistogramOptions = {}
  ): CumulativeHistogramResult {
    const hist = this.create(data, options);
    const cumulativeCounts: number[] = [];
    let sum = 0;

    for (const count of hist.counts) {
      sum += count;
      cumulativeCounts.push(sum);
    }

    const total = sum !== 0 ? sum : 1; // Avoid division by zero
    return {
      ...hist,
      counts: cumulativeCounts,
      normalized: cumulativeCounts.map((c) => c / total),
    };
  },
};

/**
 * Time-series analysis helpers
 */
export const TimeSeries = {
  /**
   * Calculate moving average
   * @param data - Time series data
   * @param window - Window size
   * @returns Smoothed data
   */
  movingAverage(data: number[], window: number): number[] {
    if (data.length === 0 || window < 1) return [];

    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.ceil(window / 2));
      const slice = data.slice(start, end);
      result.push(Statistics.mean(slice));
    }
    return result;
  },

  /**
   * Calculate exponential moving average
   * @param data - Time series data
   * @param alpha - Smoothing factor (0-1)
   * @returns Smoothed data
   */
  exponentialMovingAverage(
    data: number[],
    alpha = EXPONENTIAL_MA_DEFAULT_ALPHA
  ): number[] {
    if (data.length === 0) return [];
    if (alpha < 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1');
    }

    const firstValue = data[0];
    if (firstValue === undefined) return [];

    const result: number[] = [firstValue];
    for (let i = 1; i < data.length; i++) {
      const currentValue = data[i];
      const previousResult = result[i - 1];
      if (currentValue !== undefined && previousResult !== undefined) {
        result.push(alpha * currentValue + (1 - alpha) * previousResult);
      }
    }
    return result;
  },

  /**
   * Detect outliers using z-score method
   * @param data - Time series data
   * @param threshold - Z-score threshold
   * @returns Indices of outliers
   */
  detectOutliers(
    data: number[],
    threshold = OUTLIER_Z_SCORE_THRESHOLD
  ): number[] {
    if (data.length === 0) return [];

    const mean = Statistics.mean(data);
    const std = Statistics.standardDeviation(data);

    if (std === 0) return [];

    const outliers: number[] = [];
    data.forEach((value, index) => {
      const z = Math.abs((value - mean) / std);
      if (z > threshold) {
        outliers.push(index);
      }
    });

    return outliers;
  },

  /**
   * Calculate rate of change
   * @param data - Time series data
   * @param times - Time values (optional)
   * @returns Rate of change
   */
  rateOfChange(data: number[], times: number[] | null = null): number[] {
    if (data.length < 2) return [];

    const result: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const currentData = data[i];
      const previousData = data[i - 1];
      if (currentData === undefined || previousData === undefined) continue;

      let dt = 1;
      if (times !== null) {
        const currentTime = times[i];
        const previousTime = times[i - 1];
        if (currentTime !== undefined && previousTime !== undefined) {
          dt = currentTime - previousTime;
        }
      }
      result.push((currentData - previousData) / dt);
    }
    return result;
  },

  /**
   * Calculate autocorrelation
   * @param data - Time series data
   * @param lag - Lag value
   * @returns Autocorrelation coefficient
   */
  autocorrelation(data: number[], lag: number): number {
    if (data.length === 0 || lag >= data.length) return 0;

    const mean = Statistics.mean(data);
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < data.length - lag; i++) {
      const value = data[i];
      const laggedValue = data[i + lag];
      if (value !== undefined && laggedValue !== undefined) {
        numerator += (value - mean) * (laggedValue - mean);
      }
    }

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      if (value !== undefined) {
        denominator += Math.pow(value - mean, 2);
      }
    }

    return denominator === 0 ? 0 : numerator / denominator;
  },

  /**
   * Resample time series data
   * @param data - Time series data
   * @param times - Original time values
   * @param newTimes - New time values to interpolate to
   * @returns Resampled data
   */
  resample(data: number[], times: number[], newTimes: number[]): number[] {
    if (data.length !== times.length) {
      return [];
    }

    return newTimes.map((newTime) => {
      // Find surrounding points
      let i = 0;
      while (i < times.length && (times[i] ?? 0) < newTime) i++;

      if (i === 0) return data[0] ?? 0;
      if (i === times.length) return data[data.length - 1] ?? 0;

      // Linear interpolation
      const t0 = times[i - 1] ?? 0;
      const t1 = times[i] ?? 0;
      const v0 = data[i - 1] ?? 0;
      const v1 = data[i] ?? 0;
      const fraction = t1 === t0 ? 0 : (newTime - t0) / (t1 - t0);

      return v0 + fraction * (v1 - v0);
    });
  },

  /**
   * Calculate dead time correction
   * @param observedRate - Observed count rate (counts/sec)
   * @param deadTime - Dead time in seconds
   * @returns Corrected count rate
   */
  deadTimeCorrection(observedRate: number, deadTime: number): number {
    // Using the formula: true_rate = observed_rate / (1 - observed_rate * dead_time)
    const denominator = 1 - observedRate * deadTime;
    if (denominator <= 0) {
      throw new Error('Dead time correction overflow - rate too high');
    }
    return observedRate / denominator;
  },
};

/**
 * Coincidence analysis utilities
 */
export const Coincidence = {
  /**
   * Calculate expected accidental coincidence rate
   * @param rate1 - Rate of first detector (counts/sec)
   * @param rate2 - Rate of second detector (counts/sec)
   * @param coincidenceWindow - Coincidence window in seconds
   * @returns Expected accidental rate (counts/sec)
   */
  accidentalRate(
    rate1: number,
    rate2: number,
    coincidenceWindow: number
  ): number {
    return 2 * rate1 * rate2 * coincidenceWindow;
  },

  /**
   * Calculate true coincidence rate
   * @param measuredRate - Measured coincidence rate
   * @param rate1 - Rate of first detector
   * @param rate2 - Rate of second detector
   * @param coincidenceWindow - Coincidence window in seconds
   * @returns True coincidence rate
   */
  trueRate(
    measuredRate: number,
    rate1: number,
    rate2: number,
    coincidenceWindow: number
  ): number {
    const accidental = this.accidentalRate(rate1, rate2, coincidenceWindow);
    return Math.max(0, measuredRate - accidental);
  },

  /**
   * Calculate signal-to-noise ratio
   * @param trueRate - True coincidence rate
   * @param accidentalRate - Accidental coincidence rate
   * @returns Signal-to-noise ratio
   */
  signalToNoise(trueRate: number, accidentalRate: number): number {
    return accidentalRate === 0 ? Infinity : trueRate / accidentalRate;
  },

  /**
   * Calculate optimal coincidence window
   * @param rate1 - Rate of first detector
   * @param rate2 - Rate of second detector
   * @param targetSNR - Target signal-to-noise ratio
   * @returns Optimal window in seconds
   */
  optimalWindow(
    rate1: number,
    rate2: number,
    targetSNR = DEFAULT_TARGET_SNR
  ): number {
    // Simplified estimation - actual optimal depends on specific application
    const product = Math.sqrt(rate1 * rate2);
    if (product === 0) return Infinity;
    return 1 / (2 * targetSNR * product);
  },
};

export default {
  Statistics,
  Histogram,
  TimeSeries,
  Coincidence,
};
