/**
 * @fileoverview Calibration support for CD48 including storage and wizard
 * @module calibration
 */

import type CD48 from './cd48.js';

import { CHANNEL_MIN, CHANNEL_MAX } from './validation.js';

import {
  JSON_INDENT_SPACES,
  MIN_CALIBRATION_POINTS,
  PLATEAU_REGION_THRESHOLD_LOWER,
  PLATEAU_REGION_THRESHOLD_UPPER,
  GAIN_MIN,
  GAIN_MAX,
  EXPECTED_CHANNEL_COUNT,
  DEFAULT_BACKGROUND_DURATION,
  DEFAULT_CALIBRATION_DURATION,
} from './constants.js';

/**
 * Channel calibration data stored by channel index
 */
export type ChannelCalibrationMap = Record<number, number>;

/**
 * Calibration profile options
 */
export interface CalibrationProfileOptions {
  name?: string;
  description?: string;
  date?: Date;
}

/**
 * Calibration profile JSON representation
 */
export interface CalibrationProfileJSON {
  name: string;
  description: string;
  date: string;
  voltages: ChannelCalibrationMap;
  thresholds: ChannelCalibrationMap;
  gains: ChannelCalibrationMap;
  offsets: ChannelCalibrationMap;
  metadata: Record<string, unknown>;
}

/**
 * Type guard for ChannelCalibrationMap
 */
function isChannelCalibrationMap(
  value: unknown
): value is ChannelCalibrationMap {
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value).every(
    ([key, val]) => !isNaN(Number(key)) && typeof val === 'number'
  );
}

/**
 * Type guard for CalibrationProfileJSON
 */
function isCalibrationProfileJSON(
  value: unknown
): value is CalibrationProfileJSON {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['name'] === 'string' &&
    typeof obj['description'] === 'string' &&
    typeof obj['date'] === 'string' &&
    isChannelCalibrationMap(obj['voltages']) &&
    isChannelCalibrationMap(obj['thresholds']) &&
    isChannelCalibrationMap(obj['gains']) &&
    isChannelCalibrationMap(obj['offsets']) &&
    typeof obj['metadata'] === 'object' &&
    obj['metadata'] !== null
  );
}

/**
 * Type guard for Record<string, CalibrationProfileJSON>
 */
function isCalibrationProfileRecord(
  value: unknown
): value is Record<string, CalibrationProfileJSON> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value).every(
    ([key, val]) => typeof key === 'string' && isCalibrationProfileJSON(val)
  );
}

/**
 * Safely parse JSON as CalibrationProfileRecord
 */
function parseCalibrationProfiles(
  data: string
): Record<string, CalibrationProfileJSON> {
  const parsed: unknown = JSON.parse(data);
  if (!isCalibrationProfileRecord(parsed)) {
    throw new Error('Invalid calibration profile data format');
  }
  return parsed;
}

/**
 * Two-point calibration point
 */
export interface CalibrationPoint {
  raw: number;
  actual: number;
}

/**
 * Calibration coefficients
 */
export interface CalibrationCoefficients {
  readonly gain: number;
  readonly offset: number;
}

/**
 * Calibration error statistics
 */
export interface CalibrationErrorStats {
  readonly mean: number;
  readonly std: number;
  readonly max: number;
  readonly errors: ReadonlyArray<number>;
}

/**
 * Optimal threshold result
 */
export interface OptimalThresholdResult {
  readonly optimal: number;
  readonly results: ReadonlyArray<{
    readonly threshold: number;
    readonly rate: number;
  }>;
}

/**
 * Calibration validation result
 */
export interface CalibrationValidationResult {
  readonly valid: boolean;
  readonly issues: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Calibration report
 */
export interface CalibrationReport {
  readonly profile: CalibrationProfileJSON;
  readonly summary: {
    readonly name: string;
    readonly date: Date;
    readonly channelsCalibrated: number;
    readonly hasGainCalibration: boolean;
    readonly hasThresholdCalibration: boolean;
  };
}

/**
 * Calibration profile class
 */
export class CalibrationProfile {
  public name: string;
  public description: string;
  public date: Date;
  public voltages: ChannelCalibrationMap;
  public thresholds: ChannelCalibrationMap;
  public gains: ChannelCalibrationMap;
  public offsets: ChannelCalibrationMap;
  public metadata: Record<string, unknown>;

  /**
   * Create a calibration profile
   * @param options - Profile options
   */
  constructor(options: CalibrationProfileOptions = {}) {
    this.name = options.name ?? 'Untitled Profile';
    this.description = options.description ?? '';
    this.date = options.date ?? new Date();
    this.voltages = {};
    this.thresholds = {};
    this.gains = {};
    this.offsets = {};
    this.metadata = {};
  }

  /**
   * Set voltage calibration for a channel
   * @param channel - Channel number (0-7)
   * @param voltage - Calibrated voltage value
   */
  setVoltage(channel: number, voltage: number): void {
    if (channel < CHANNEL_MIN || channel > CHANNEL_MAX) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.voltages[channel] = voltage;
  }

  /**
   * Get voltage calibration for a channel
   * @param channel - Channel number (0-7)
   * @returns Calibrated voltage or null if not set
   */
  getVoltage(channel: number): number | null {
    return this.voltages[channel] ?? null;
  }

  /**
   * Set threshold calibration for a channel
   * @param channel - Channel number (0-7)
   * @param threshold - Threshold value
   */
  setThreshold(channel: number, threshold: number): void {
    if (channel < CHANNEL_MIN || channel > CHANNEL_MAX) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.thresholds[channel] = threshold;
  }

  /**
   * Get threshold calibration for a channel
   * @param channel - Channel number (0-7)
   * @returns Threshold value or null if not set
   */
  getThreshold(channel: number): number | null {
    return this.thresholds[channel] ?? null;
  }

  /**
   * Set gain calibration for a channel
   * @param channel - Channel number (0-7)
   * @param gain - Gain value
   */
  setGain(channel: number, gain: number): void {
    if (channel < CHANNEL_MIN || channel > CHANNEL_MAX) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.gains[channel] = gain;
  }

  /**
   * Get gain calibration for a channel
   * @param channel - Channel number (0-7)
   * @returns Gain value or null if not set
   */
  getGain(channel: number): number | null {
    return this.gains[channel] ?? null;
  }

  /**
   * Set offset calibration for a channel
   * @param channel - Channel number (0-7)
   * @param offset - Offset value
   */
  setOffset(channel: number, offset: number): void {
    if (channel < CHANNEL_MIN || channel > CHANNEL_MAX) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.offsets[channel] = offset;
  }

  /**
   * Get offset calibration for a channel
   * @param channel - Channel number (0-7)
   * @returns Offset value or null if not set
   */
  getOffset(channel: number): number | null {
    return this.offsets[channel] ?? null;
  }

  /**
   * Apply calibration to raw count data
   * @param channel - Channel number (0-7)
   * @param rawCount - Raw count value
   * @returns Calibrated count value
   */
  applyCounts(channel: number, rawCount: number): number {
    const gain = this.gains[channel] ?? 1;
    const offset = this.offsets[channel] ?? 0;
    return rawCount * gain + offset;
  }

  /**
   * Export profile to JSON
   * @returns Profile data
   */
  toJSON(): CalibrationProfileJSON {
    return {
      name: this.name,
      description: this.description,
      date: this.date.toISOString(),
      voltages: this.voltages,
      thresholds: this.thresholds,
      gains: this.gains,
      offsets: this.offsets,
      metadata: this.metadata,
    };
  }

  /**
   * Import profile from JSON
   * @param data - Profile data
   * @returns New profile instance
   */
  static fromJSON(data: CalibrationProfileJSON): CalibrationProfile {
    const profile = new CalibrationProfile({
      name: data.name,
      description: data.description,
      date: new Date(data.date),
    });
    profile.voltages = data.voltages;
    profile.thresholds = data.thresholds;
    profile.gains = data.gains;
    profile.offsets = data.offsets;
    profile.metadata = data.metadata;
    return profile;
  }
}

/**
 * Calibration storage manager using localStorage
 */
export class CalibrationStorage {
  private readonly storageKey: string;

  constructor(storageKey = 'cd48_calibration_profiles') {
    this.storageKey = storageKey;
  }

  /**
   * Save a calibration profile
   * @param profile - Profile to save
   */
  save(profile: CalibrationProfile): void {
    const profiles = this.loadAll();
    profiles[profile.name] = profile.toJSON();
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
  }

  /**
   * Load a calibration profile by name
   * @param name - Profile name
   * @returns Profile or null if not found
   */
  load(name: string): CalibrationProfile | null {
    const profiles = this.loadAll();
    const profileData = profiles[name];
    if (profileData !== undefined) {
      return CalibrationProfile.fromJSON(profileData);
    }
    return null;
  }

  /**
   * Load all calibration profiles
   * @returns All profiles as plain objects
   */
  loadAll(): Record<string, CalibrationProfileJSON> {
    const data = localStorage.getItem(this.storageKey);
    if (data === null || data === '') return {};
    try {
      return parseCalibrationProfiles(data);
    } catch {
      // If data is corrupted, return empty object
      return {};
    }
  }

  /**
   * Get list of all profile names
   * @returns Array of profile names
   */
  listProfiles(): string[] {
    return Object.keys(this.loadAll());
  }

  /**
   * Delete a calibration profile
   * @param name - Profile name
   */
  delete(name: string): void {
    const profiles = this.loadAll();
    delete profiles[name];
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
  }

  /**
   * Clear all calibration profiles
   */
  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Export all profiles to JSON string
   * @returns JSON string of all profiles
   */
  export(): string {
    return JSON.stringify(this.loadAll(), null, JSON_INDENT_SPACES);
  }

  /**
   * Import profiles from JSON string
   * @param jsonString - JSON string of profiles
   * @param merge - Merge with existing profiles
   * @throws Error if JSON format is invalid
   */
  import(jsonString: string, merge = false): void {
    const imported = parseCalibrationProfiles(jsonString);
    if (merge) {
      const existing = this.loadAll();
      const merged = { ...existing, ...imported };
      localStorage.setItem(this.storageKey, JSON.stringify(merged));
    } else {
      localStorage.setItem(this.storageKey, JSON.stringify(imported));
    }
  }
}

/**
 * Voltage calibration utilities
 */
export class VoltageCalibration {
  /**
   * Perform two-point calibration
   * @param point1 - First calibration point
   * @param point2 - Second calibration point
   * @returns Calibration coefficients
   */
  static twoPoint(
    point1: CalibrationPoint,
    point2: CalibrationPoint
  ): CalibrationCoefficients {
    const rawDiff = point2.raw - point1.raw;
    if (rawDiff === 0) {
      return { gain: 1, offset: 0 };
    }
    const gain = (point2.actual - point1.actual) / rawDiff;
    const offset = point1.actual - gain * point1.raw;
    return { gain, offset };
  }

  /**
   * Apply calibration to raw value
   * @param raw - Raw value
   * @param gain - Gain coefficient
   * @param offset - Offset coefficient
   * @returns Calibrated value
   */
  static apply(raw: number, gain: number, offset: number): number {
    return raw * gain + offset;
  }

  /**
   * Perform multi-point calibration using least squares
   * @param points - Calibration points
   * @returns Calibration coefficients
   */
  static multiPoint(points: CalibrationPoint[]): CalibrationCoefficients {
    if (points.length < MIN_CALIBRATION_POINTS) {
      throw new Error(
        `At least ${MIN_CALIBRATION_POINTS} calibration points required`
      );
    }

    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    points.forEach((point) => {
      sumX += point.raw;
      sumY += point.actual;
      sumXY += point.raw * point.actual;
      sumXX += point.raw * point.raw;
    });

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
      return { gain: 1, offset: 0 };
    }

    const gain = (n * sumXY - sumX * sumY) / denominator;
    const offset = (sumY - gain * sumX) / n;

    return { gain, offset };
  }

  /**
   * Calculate calibration error
   * @param points - Test points
   * @param gain - Gain coefficient
   * @param offset - Offset coefficient
   * @returns Error statistics
   */
  static calculateError(
    points: CalibrationPoint[],
    gain: number,
    offset: number
  ): CalibrationErrorStats {
    const errors = points.map((point) => {
      const calibrated = this.apply(point.raw, gain, offset);
      return Math.abs(calibrated - point.actual);
    });

    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    const variance =
      errors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / errors.length;
    const std = Math.sqrt(variance);
    const max = Math.max(...errors);

    return { mean, std, max, errors };
  }
}

/**
 * Calibration wizard helper class
 */
export class CalibrationWizard {
  public readonly cd48: CD48;
  public profile: CalibrationProfile;
  public readonly storage: CalibrationStorage;
  public currentStep: number;
  public calibrationData: Record<string, unknown>;

  /**
   * Create a calibration wizard
   * @param cd48 - CD48 device instance
   */
  constructor(cd48: CD48) {
    this.cd48 = cd48;
    this.profile = new CalibrationProfile();
    this.storage = new CalibrationStorage();
    this.currentStep = 0;
    this.calibrationData = {};
  }

  /**
   * Start voltage calibration for a channel
   * @param channel - Channel number (0-7)
   * @param duration - Measurement duration in seconds
   * @returns Average count rate
   */
  async measureChannelRate(
    channel: number,
    duration = DEFAULT_CALIBRATION_DURATION
  ): Promise<number> {
    if (!this.cd48.isConnected()) {
      throw new Error('CD48 device not connected');
    }

    const result = await this.cd48.measureRate(channel, duration);
    return result.rate;
  }

  /**
   * Perform automatic background measurement
   * @param channels - Channels to measure
   * @param duration - Measurement duration
   * @returns Background rates for each channel
   */
  async measureBackground(
    channels: number[],
    duration = DEFAULT_BACKGROUND_DURATION
  ): Promise<Record<number, number>> {
    const backgrounds: Record<number, number> = {};

    for (const channel of channels) {
      const rate = await this.measureChannelRate(channel, duration);
      backgrounds[channel] = rate;
      this.profile.metadata[`background_ch${channel}`] = rate;
    }

    return backgrounds;
  }

  /**
   * Calibrate channel voltage
   * @param channel - Channel number
   * @param knownVoltage - Known voltage value
   */
  async calibrateVoltage(channel: number, knownVoltage: number): Promise<void> {
    this.profile.setVoltage(channel, knownVoltage);
    this.profile.metadata[`voltage_calibrated_ch${channel}`] = true;
  }

  /**
   * Auto-calibrate gain using reference source
   * @param channel - Channel number
   * @param referenceRate - Known reference rate
   * @param duration - Measurement duration
   * @returns Calculated gain
   */
  async calibrateGain(
    channel: number,
    referenceRate: number,
    duration = DEFAULT_BACKGROUND_DURATION
  ): Promise<number> {
    const measuredRate = await this.measureChannelRate(channel, duration);
    const gain = measuredRate === 0 ? 1 : referenceRate / measuredRate;
    this.profile.setGain(channel, gain);
    return gain;
  }

  /**
   * Find optimal threshold for a channel
   * @param channel - Channel number
   * @param testThresholds - Array of threshold values to test
   * @param duration - Measurement duration per threshold
   * @returns Optimal threshold and rate data
   */
  async findOptimalThreshold(
    channel: number,
    testThresholds: number[],
    duration = DEFAULT_CALIBRATION_DURATION
  ): Promise<OptimalThresholdResult> {
    const results: Array<{ threshold: number; rate: number }> = [];

    for (const threshold of testThresholds) {
      const rate = await this.measureChannelRate(channel, duration);
      results.push({ threshold, rate });
    }

    // Find plateau region (where rate is stable)
    let optimalThreshold = testThresholds[0] ?? 0;
    let maxRate = 0;

    results.forEach((result) => {
      if (
        result.rate > maxRate * PLATEAU_REGION_THRESHOLD_LOWER &&
        result.rate < maxRate * PLATEAU_REGION_THRESHOLD_UPPER
      ) {
        // In plateau
        optimalThreshold = result.threshold;
      }
      maxRate = Math.max(maxRate, result.rate);
    });

    this.profile.setThreshold(channel, optimalThreshold);
    return { optimal: optimalThreshold, results };
  }

  /**
   * Save current calibration profile
   * @param name - Profile name
   */
  save(name?: string): void {
    if (name !== undefined && name !== '') this.profile.name = name;
    this.storage.save(this.profile);
  }

  /**
   * Load a calibration profile
   * @param name - Profile name
   * @returns Loaded profile
   */
  load(name: string): CalibrationProfile | null {
    const profile = this.storage.load(name);
    if (profile !== null) {
      this.profile = profile;
    }
    return profile;
  }

  /**
   * Generate calibration report
   * @returns Calibration report data
   */
  generateReport(): CalibrationReport {
    return {
      profile: this.profile.toJSON(),
      summary: {
        name: this.profile.name,
        date: this.profile.date,
        channelsCalibrated: Object.keys(this.profile.voltages).length,
        hasGainCalibration: Object.keys(this.profile.gains).length > 0,
        hasThresholdCalibration:
          Object.keys(this.profile.thresholds).length > 0,
      },
    };
  }

  /**
   * Validate calibration profile
   * @returns Validation results
   */
  validate(): CalibrationValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for missing calibrations
    for (let i = 0; i < EXPECTED_CHANNEL_COUNT; i++) {
      if (this.profile.getVoltage(i) === null) {
        warnings.push(`Channel ${i} voltage not calibrated`);
      }
      if (this.profile.getGain(i) === null) {
        warnings.push(`Channel ${i} gain not calibrated`);
      }
    }

    // Check for unreasonable values
    for (let i = 0; i < EXPECTED_CHANNEL_COUNT; i++) {
      const gain = this.profile.getGain(i);
      if (gain !== null && (gain < GAIN_MIN || gain > GAIN_MAX)) {
        issues.push(
          `Channel ${i} gain ${gain} is unusual (expected ${GAIN_MIN}-${GAIN_MAX})`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }
}

export default {
  CalibrationProfile,
  CalibrationStorage,
  VoltageCalibration,
  CalibrationWizard,
};
