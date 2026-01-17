/**
 * Type definitions for CD48 dev-utils module
 */

export interface DevLoggerOptions {
  enabled?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
  timestamps?: boolean;
}

export interface PerformanceStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface ErrorContext {
  [key: string]: unknown;
}

export interface DevModeOptions {
  logger?: DevLoggerOptions;
  showOverlay?: boolean;
  exposeGlobally?: boolean;
}

export interface DevModeReturn {
  logger: DevLogger;
  errorOverlay: ErrorOverlay;
  perfMonitor: PerformanceMonitor;
}

/**
 * Development logger with enhanced formatting and filtering
 */
export class DevLogger {
  enabled: boolean;
  level: string;
  prefix: string;
  timestamps: boolean;
  colors: Record<string, string>;
  levels: Record<string, number>;
  minLevel: number;

  constructor(options?: DevLoggerOptions);

  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  success(...args: unknown[]): void;
  custom(message: string, style: string): void;
  time(label: string): () => string;
  table(obj: object): void;
  group(label: string, fn: () => void): void;
}

/**
 * Error overlay for displaying runtime errors
 */
export class ErrorOverlay {
  overlay: HTMLDivElement | null;
  errors: Array<{ error: Error; context: ErrorContext; timestamp: Date }>;

  constructor();

  show(error: Error, context?: ErrorContext): void;
  hide(): void;
  clear(): void;
}

/**
 * Performance monitor for tracking metrics
 */
export class PerformanceMonitor {
  metrics: Record<string, number[]>;
  marks: Record<string, number>;

  constructor();

  start(name: string): void;
  end(name: string): number;
  getStats(name: string): PerformanceStats | null;
  getAllStats(): Record<string, PerformanceStats>;
  clear(): void;
  report(): void;
}

/**
 * Setup global error handlers for development
 */
export function setupDevMode(options?: DevModeOptions): DevModeReturn;

declare const _default: {
  DevLogger: typeof DevLogger;
  ErrorOverlay: typeof ErrorOverlay;
  PerformanceMonitor: typeof PerformanceMonitor;
  setupDevMode: typeof setupDevMode;
};
export default _default;
