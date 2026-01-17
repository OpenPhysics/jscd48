/**
 * @fileoverview TypeScript definitions for development utilities
 * @module dev-utils
 */

/**
 * Dev logger options
 */
export interface DevLoggerOptions {
  enabled?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
  timestamps?: boolean;
}

/**
 * Development logger with enhanced formatting and filtering
 */
export class DevLogger {
  enabled: boolean;
  level: string;
  prefix: string;
  timestamps: boolean;
  colors: {
    debug: string;
    info: string;
    warn: string;
    error: string;
    success: string;
  };
  levels: Record<string, number>;
  minLevel: number;

  constructor(options?: DevLoggerOptions);

  /**
   * Log debug message
   */
  debug(...args: any[]): void;

  /**
   * Log info message
   */
  info(...args: any[]): void;

  /**
   * Log warning message
   */
  warn(...args: any[]): void;

  /**
   * Log error message
   */
  error(...args: any[]): void;

  /**
   * Log success message
   */
  success(...args: any[]): void;

  /**
   * Log with custom styling
   */
  custom(message: string, style: string): void;

  /**
   * Create a timer
   */
  time(label: string): () => number;

  /**
   * Log object in table format
   */
  table(obj: any): void;

  /**
   * Group related logs
   */
  group(label: string, fn: () => void): void;
}

/**
 * Error context
 */
export interface ErrorContext {
  [key: string]: any;
}

/**
 * Error entry
 */
export interface ErrorEntry {
  error: Error;
  context: ErrorContext;
  timestamp: Date;
}

/**
 * Error overlay for displaying runtime errors
 */
export class ErrorOverlay {
  overlay: HTMLDivElement | null;
  errors: ErrorEntry[];

  constructor();

  /**
   * Show error in overlay
   */
  show(error: Error, context?: ErrorContext): void;

  /**
   * Hide error overlay
   */
  hide(): void;

  /**
   * Clear all errors
   */
  clear(): void;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

/**
 * Performance monitor for tracking metrics
 */
export class PerformanceMonitor {
  metrics: Record<string, number[]>;
  marks: Record<string, number>;

  constructor();

  /**
   * Start a performance measurement
   */
  start(name: string): void;

  /**
   * End a performance measurement
   */
  end(name: string): number;

  /**
   * Get statistics for a metric
   */
  getStats(name: string): PerformanceStats | null;

  /**
   * Get all metrics
   */
  getAllStats(): Record<string, PerformanceStats | null>;

  /**
   * Clear all metrics
   */
  clear(): void;

  /**
   * Print performance report
   */
  report(): void;
}

/**
 * Dev mode options
 */
export interface DevModeOptions {
  logger?: DevLoggerOptions;
  showOverlay?: boolean;
  exposeGlobally?: boolean;
}

/**
 * Dev mode utilities
 */
export interface DevModeUtilities {
  logger: DevLogger;
  errorOverlay: ErrorOverlay;
  perfMonitor: PerformanceMonitor;
}

/**
 * Setup global error handlers for development
 */
export function setupDevMode(options?: DevModeOptions): DevModeUtilities;

declare const _default: {
  DevLogger: typeof DevLogger;
  ErrorOverlay: typeof ErrorOverlay;
  PerformanceMonitor: typeof PerformanceMonitor;
  setupDevMode: typeof setupDevMode;
};

export default _default;
