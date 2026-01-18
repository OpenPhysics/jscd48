/**
 * jscd48 - JavaScript/TypeScript interface for the CD48 Coincidence Counter
 *
 * @packageDocumentation
 */

// Main CD48 class
export { default as CD48, default } from './cd48.js';

// Export types from CD48
export type {
  CD48Options,
  ChannelInputs,
  CountData,
  MeasurementUncertainty,
  RateMeasurement,
  CoincidenceUncertainty,
  CoincidenceMeasurementOptions,
  CoincidenceMeasurement,
  DisconnectCallback,
  ReconnectCallback,
} from './cd48.js';

// Error classes
export {
  CD48Error,
  UnsupportedBrowserError,
  NotConnectedError,
  ConnectionError,
  DeviceSelectionCancelledError,
  CommandTimeoutError,
  InvalidResponseError,
  ValidationError,
  InvalidChannelError,
  InvalidVoltageError,
  CommunicationError,
} from './errors.js';

// Validation utilities
export {
  CHANNEL_MIN,
  CHANNEL_MAX,
  VOLTAGE_MIN,
  VOLTAGE_MAX,
  BYTE_MIN,
  BYTE_MAX,
  REPEAT_INTERVAL_MIN,
  REPEAT_INTERVAL_MAX,
  validateChannel,
  validateVoltage,
  validateByte,
  validateRepeatInterval,
  validateDuration,
  validateImpedanceMode,
  validateBoolean,
  clamp,
  clampVoltage,
  clampRepeatInterval,
  voltageToByte,
  byteToVoltage,
} from './validation.js';

export type { ImpedanceMode } from './validation.js';

// Analysis utilities
export { Statistics, Histogram, TimeSeries, Coincidence } from './analysis.js';

export type {
  LinearRegressionResult,
  StatisticalSummary,
  HistogramResult,
  CumulativeHistogramResult,
  HistogramOptions,
} from './analysis.js';

// Calibration utilities
export {
  CalibrationProfile,
  CalibrationStorage,
  VoltageCalibration,
  CalibrationWizard,
} from './calibration.js';

export type {
  ChannelCalibrationMap,
  CalibrationProfileOptions,
  CalibrationProfileJSON,
  CalibrationPoint,
  CalibrationCoefficients,
  CalibrationErrorStats,
  OptimalThresholdResult,
  CalibrationValidationResult,
  CalibrationReport,
} from './calibration.js';

// Development utilities
export {
  DevLogger,
  ErrorOverlay,
  PerformanceMonitor,
  setupDevMode,
} from './dev-utils.js';

export type {
  LogLevel,
  LoggerColors,
  DevLoggerOptions,
  ErrorContext,
  StoredError,
  PerformanceStats,
  SetupDevModeOptions,
  DevModeUtilities,
  GlobalDevUtilities,
} from './dev-utils.js';
