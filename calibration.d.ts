/**
 * @fileoverview TypeScript definitions for calibration support
 * @module calibration
 */

/**
 * Calibration profile options
 */
export interface CalibrationProfileOptions {
  name?: string;
  description?: string;
  date?: Date;
}

/**
 * Calibration profile data
 */
export interface CalibrationProfileData {
  name: string;
  description: string;
  date: string;
  voltages: Record<number, number>;
  thresholds: Record<number, number>;
  gains: Record<number, number>;
  offsets: Record<number, number>;
  metadata: Record<string, any>;
}

/**
 * Calibration profile class
 */
export class CalibrationProfile {
  name: string;
  description: string;
  date: Date;
  voltages: Record<number, number>;
  thresholds: Record<number, number>;
  gains: Record<number, number>;
  offsets: Record<number, number>;
  metadata: Record<string, any>;

  constructor(options?: CalibrationProfileOptions);

  /**
   * Set voltage calibration for a channel
   */
  setVoltage(channel: number, voltage: number): void;

  /**
   * Get voltage calibration for a channel
   */
  getVoltage(channel: number): number | null;

  /**
   * Set threshold calibration for a channel
   */
  setThreshold(channel: number, threshold: number): void;

  /**
   * Get threshold calibration for a channel
   */
  getThreshold(channel: number): number | null;

  /**
   * Set gain calibration for a channel
   */
  setGain(channel: number, gain: number): void;

  /**
   * Get gain calibration for a channel
   */
  getGain(channel: number): number | null;

  /**
   * Set offset calibration for a channel
   */
  setOffset(channel: number, offset: number): void;

  /**
   * Get offset calibration for a channel
   */
  getOffset(channel: number): number | null;

  /**
   * Apply calibration to raw count data
   */
  applyCounts(channel: number, rawCount: number): number;

  /**
   * Export profile to JSON
   */
  toJSON(): CalibrationProfileData;

  /**
   * Import profile from JSON
   */
  static fromJSON(data: CalibrationProfileData): CalibrationProfile;
}

/**
 * Calibration storage manager using localStorage
 */
export class CalibrationStorage {
  storageKey: string;

  constructor(storageKey?: string);

  /**
   * Save a calibration profile
   */
  save(profile: CalibrationProfile): void;

  /**
   * Load a calibration profile by name
   */
  load(name: string): CalibrationProfile | null;

  /**
   * Load all calibration profiles
   */
  loadAll(): Record<string, CalibrationProfileData>;

  /**
   * Get list of all profile names
   */
  listProfiles(): string[];

  /**
   * Delete a calibration profile
   */
  delete(name: string): void;

  /**
   * Clear all calibration profiles
   */
  clear(): void;

  /**
   * Export all profiles to JSON string
   */
  export(): string;

  /**
   * Import profiles from JSON string
   */
  import(jsonString: string, merge?: boolean): void;
}

/**
 * Calibration point
 */
export interface CalibrationPoint {
  raw: number;
  actual: number;
}

/**
 * Calibration coefficients
 */
export interface CalibrationCoefficients {
  gain: number;
  offset: number;
}

/**
 * Calibration error statistics
 */
export interface CalibrationError {
  mean: number;
  std: number;
  max: number;
  errors: number[];
}

/**
 * Voltage calibration utilities
 */
export class VoltageCalibration {
  /**
   * Perform two-point calibration
   */
  static twoPoint(point1: CalibrationPoint, point2: CalibrationPoint): CalibrationCoefficients;

  /**
   * Apply calibration to raw value
   */
  static apply(raw: number, gain: number, offset: number): number;

  /**
   * Perform multi-point calibration using least squares
   */
  static multiPoint(points: CalibrationPoint[]): CalibrationCoefficients;

  /**
   * Calculate calibration error
   */
  static calculateError(
    points: CalibrationPoint[],
    gain: number,
    offset: number
  ): CalibrationError;
}

/**
 * Threshold calibration result
 */
export interface ThresholdCalibrationResult {
  optimal: number;
  results: Array<{ threshold: number; rate: number }>;
}

/**
 * Calibration report
 */
export interface CalibrationReport {
  profile: CalibrationProfileData;
  summary: {
    name: string;
    date: Date;
    channelsCalibrated: number;
    hasGainCalibration: boolean;
    hasThresholdCalibration: boolean;
  };
}

/**
 * Calibration validation result
 */
export interface CalibrationValidation {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Calibration wizard helper class
 */
export class CalibrationWizard {
  cd48: any;
  profile: CalibrationProfile;
  storage: CalibrationStorage;
  currentStep: number;
  calibrationData: Record<string, any>;

  constructor(cd48: any);

  /**
   * Start voltage calibration for a channel
   */
  measureChannelRate(channel: number, duration?: number): Promise<number>;

  /**
   * Perform automatic background measurement
   */
  measureBackground(channels: number[], duration?: number): Promise<Record<number, number>>;

  /**
   * Calibrate channel voltage
   */
  calibrateVoltage(channel: number, knownVoltage: number): Promise<void>;

  /**
   * Auto-calibrate gain using reference source
   */
  calibrateGain(channel: number, referenceRate: number, duration?: number): Promise<number>;

  /**
   * Find optimal threshold for a channel
   */
  findOptimalThreshold(
    channel: number,
    testThresholds: number[],
    duration?: number
  ): Promise<ThresholdCalibrationResult>;

  /**
   * Save current calibration profile
   */
  save(name: string): void;

  /**
   * Load a calibration profile
   */
  load(name: string): CalibrationProfile | null;

  /**
   * Generate calibration report
   */
  generateReport(): CalibrationReport;

  /**
   * Validate calibration profile
   */
  validate(): CalibrationValidation;
}

declare const _default: {
  CalibrationProfile: typeof CalibrationProfile;
  CalibrationStorage: typeof CalibrationStorage;
  VoltageCalibration: typeof VoltageCalibration;
  CalibrationWizard: typeof CalibrationWizard;
};

export default _default;
