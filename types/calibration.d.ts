/**
 * Type definitions for CD48 calibration module
 */

import type CD48 from '../cd48';

export interface CalibrationProfileOptions {
  name?: string;
  description?: string;
  date?: Date;
}

export interface CalibrationProfileJSON {
  name: string;
  description: string;
  date: string;
  voltages: Record<number, number>;
  thresholds: Record<number, number>;
  gains: Record<number, number>;
  offsets: Record<number, number>;
  metadata: Record<string, unknown>;
}

export interface CalibrationCoefficients {
  gain: number;
  offset: number;
}

export interface CalibrationErrorStats {
  mean: number;
  std: number;
  max: number;
  errors: number[];
}

export interface CalibrationPoint {
  raw: number;
  actual: number;
}

export interface ThresholdResult {
  threshold: number;
  rate: number;
}

export interface OptimalThresholdResult {
  optimal: number;
  results: ThresholdResult[];
}

export interface CalibrationReportSummary {
  name: string;
  date: Date;
  channelsCalibrated: number;
  hasGainCalibration: boolean;
  hasThresholdCalibration: boolean;
}

export interface CalibrationReport {
  profile: CalibrationProfileJSON;
  summary: CalibrationReportSummary;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
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
  metadata: Record<string, unknown>;

  constructor(options?: CalibrationProfileOptions);

  setVoltage(channel: number, voltage: number): void;
  getVoltage(channel: number): number | null;
  setThreshold(channel: number, threshold: number): void;
  getThreshold(channel: number): number | null;
  setGain(channel: number, gain: number): void;
  getGain(channel: number): number | null;
  setOffset(channel: number, offset: number): void;
  getOffset(channel: number): number | null;
  applyCounts(channel: number, rawCount: number): number;
  toJSON(): CalibrationProfileJSON;
  static fromJSON(data: CalibrationProfileJSON): CalibrationProfile;
}

/**
 * Calibration storage manager using localStorage
 */
export class CalibrationStorage {
  storageKey: string;

  constructor(storageKey?: string);

  save(profile: CalibrationProfile): void;
  load(name: string): CalibrationProfile | null;
  loadAll(): Record<string, CalibrationProfileJSON>;
  listProfiles(): string[];
  delete(name: string): void;
  clear(): void;
  export(): string;
  import(jsonString: string, merge?: boolean): void;
}

/**
 * Voltage calibration utilities
 */
export class VoltageCalibration {
  static twoPoint(point1: CalibrationPoint, point2: CalibrationPoint): CalibrationCoefficients;
  static apply(raw: number, gain: number, offset: number): number;
  static multiPoint(points: CalibrationPoint[]): CalibrationCoefficients;
  static calculateError(points: CalibrationPoint[], gain: number, offset: number): CalibrationErrorStats;
}

/**
 * Calibration wizard helper class
 */
export class CalibrationWizard {
  cd48: CD48 | null;
  profile: CalibrationProfile;
  storage: CalibrationStorage;
  currentStep: number;
  calibrationData: Record<string, unknown>;

  constructor(cd48: CD48);

  measureChannelRate(channel: number, duration?: number): Promise<number>;
  measureBackground(channels: number[], duration?: number): Promise<Record<number, number>>;
  calibrateVoltage(channel: number, knownVoltage: number): Promise<void>;
  calibrateGain(channel: number, referenceRate: number, duration?: number): Promise<number>;
  findOptimalThreshold(channel: number, testThresholds: number[], duration?: number): Promise<OptimalThresholdResult>;
  save(name?: string): void;
  load(name: string): CalibrationProfile | null;
  generateReport(): CalibrationReport;
  validate(): ValidationResult;
}

declare const _default: {
  CalibrationProfile: typeof CalibrationProfile;
  CalibrationStorage: typeof CalibrationStorage;
  VoltageCalibration: typeof VoltageCalibration;
  CalibrationWizard: typeof CalibrationWizard;
};
export default _default;
