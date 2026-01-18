/**
 * @fileoverview Development utilities for enhanced debugging and error handling
 * @module dev-utils
 */

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger colors configuration
 */
export interface LoggerColors {
  debug: string;
  info: string;
  warn: string;
  error: string;
  success: string;
}

/**
 * Logger options
 */
export interface DevLoggerOptions {
  enabled?: boolean;
  level?: LogLevel;
  prefix?: string;
  timestamps?: boolean;
}

/**
 * Error context for overlay display
 */
export interface ErrorContext {
  filename?: string;
  lineno?: number;
  colno?: number;
  type?: string;
  [key: string]: unknown;
}

/**
 * Stored error entry
 */
export interface StoredError {
  error: Error;
  context: ErrorContext;
  timestamp: Date;
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
 * Setup dev mode options
 */
export interface SetupDevModeOptions {
  logger?: DevLoggerOptions;
  showOverlay?: boolean;
  exposeGlobally?: boolean;
}

/**
 * Dev mode utilities return type
 */
export interface DevModeUtilities {
  logger: DevLogger;
  errorOverlay: ErrorOverlay;
  perfMonitor: PerformanceMonitor;
}

/**
 * Global dev utilities interface
 */
export interface GlobalDevUtilities extends DevModeUtilities {
  version: string;
}

// Extend Window interface for global dev utilities
declare global {
  interface Window {
    __DEV__?: GlobalDevUtilities;
  }
}

/**
 * Development logger with enhanced formatting and filtering
 */
export class DevLogger {
  private readonly enabled: boolean;
  private readonly prefix: string;
  private readonly timestamps: boolean;
  private readonly colors: LoggerColors;
  private readonly levels: Record<LogLevel, number>;
  private readonly minLevel: number;

  constructor(options: DevLoggerOptions = {}) {
    this.enabled = options.enabled !== false;
    const level = options.level ?? 'debug';
    this.prefix = options.prefix ?? '[CD48]';
    this.timestamps = options.timestamps !== false;
    this.colors = {
      debug: '#6366f1',
      info: '#3b82f6',
      warn: '#f59e0b',
      error: '#ef4444',
      success: '#10b981',
    };
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.minLevel = this.levels[level] ?? 0;
  }

  /**
   * Format timestamp
   */
  private getTimestamp(): string {
    if (!this.timestamps) return '';
    const now = new Date();
    return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
  }

  /**
   * Log debug message
   * @param args - Arguments to log
   */
  debug(...args: unknown[]): void {
    if (!this.enabled || this.minLevel > this.levels.debug) return;
    console.log(
      `%c${this.getTimestamp()} ${this.prefix} [DEBUG]`,
      `color: ${this.colors.debug}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log info message
   * @param args - Arguments to log
   */
  info(...args: unknown[]): void {
    if (!this.enabled || this.minLevel > this.levels.info) return;
    console.log(
      `%c${this.getTimestamp()} ${this.prefix} [INFO]`,
      `color: ${this.colors.info}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log warning message
   * @param args - Arguments to log
   */
  warn(...args: unknown[]): void {
    if (!this.enabled || this.minLevel > this.levels.warn) return;
    console.warn(
      `%c${this.getTimestamp()} ${this.prefix} [WARN]`,
      `color: ${this.colors.warn}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log error message
   * @param args - Arguments to log
   */
  error(...args: unknown[]): void {
    if (!this.enabled) return;
    console.error(
      `%c${this.getTimestamp()} ${this.prefix} [ERROR]`,
      `color: ${this.colors.error}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log success message
   * @param args - Arguments to log
   */
  success(...args: unknown[]): void {
    if (!this.enabled || this.minLevel > this.levels.info) return;
    console.log(
      `%c${this.getTimestamp()} ${this.prefix} [SUCCESS]`,
      `color: ${this.colors.success}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log with custom styling
   * @param message - Message to log
   * @param style - CSS style string
   */
  custom(message: string, style: string): void {
    if (!this.enabled) return;
    console.log(`%c${this.getTimestamp()} ${this.prefix} ${message}`, style);
  }

  /**
   * Create a timer
   * @param label - Timer label
   * @returns Function to end timer
   */
  time(label: string): () => string {
    if (!this.enabled) return () => '0';
    const startTime = performance.now();
    this.debug(`Timer started: ${label}`);
    return () => {
      const duration = (performance.now() - startTime).toFixed(2);
      this.debug(`Timer ended: ${label} - ${duration}ms`);
      return duration;
    };
  }

  /**
   * Log object in table format
   * @param obj - Object to log
   */
  table(obj: Record<string, unknown> | unknown[]): void {
    if (!this.enabled) return;
    console.table(obj);
  }

  /**
   * Group related logs
   * @param label - Group label
   * @param fn - Function containing logs
   */
  group<T>(label: string, fn: () => T): T {
    if (!this.enabled) return fn();
    console.group(`${this.getTimestamp()} ${this.prefix} ${label}`);
    try {
      return fn();
    } finally {
      console.groupEnd();
    }
  }
}

/**
 * Error overlay for displaying runtime errors
 */
export class ErrorOverlay {
  private overlay: HTMLDivElement | null;
  private errors: StoredError[];

  constructor() {
    this.overlay = null;
    this.errors = [];
  }

  /**
   * Create overlay DOM element
   */
  private createOverlay(): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'dev-error-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 999999;
      overflow: auto;
      padding: 20px;
      display: none;
    `;

    document.body.appendChild(this.overlay);
  }

  /**
   * Show error in overlay
   * @param error - Error to display
   * @param context - Additional context
   */
  show(error: Error, context: ErrorContext = {}): void {
    this.createOverlay();
    this.errors.push({ error, context, timestamp: new Date() });

    const errorHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h1 style="color: #ef4444; margin: 0; font-size: 24px;">
            Runtime Error
          </h1>
          <button onclick="this.getRootNode().host?.parentElement?.style.display='none'"
                  style="background: #ef4444; color: white; border: none; padding: 10px 20px;
                         border-radius: 6px; cursor: pointer; font-size: 14px;">
            Close (ESC)
          </button>
        </div>

        <div style="background: #1a1f3a; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ef4444;">
          <div style="color: #ef4444; font-weight: bold; margin-bottom: 10px;">
            ${error.name || 'Error'}
          </div>
          <div style="color: #eee; font-size: 16px; margin-bottom: 15px;">
            ${this.escapeHtml(error.message)}
          </div>
          ${
            error.stack
              ? `
            <details style="margin-top: 15px;">
              <summary style="cursor: pointer; color: #3b82f6; user-select: none;">
                Stack Trace
              </summary>
              <pre style="margin-top: 10px; color: #aaa; overflow-x: auto; font-size: 12px;">${this.escapeHtml(error.stack)}</pre>
            </details>
          `
              : ''
          }
        </div>

        ${
          Object.keys(context).length > 0
            ? `
          <div style="background: #1a1f3a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="color: #3b82f6; font-weight: bold; margin-bottom: 10px;">
              Context
            </div>
            <pre style="color: #eee; overflow-x: auto;">${this.escapeHtml(JSON.stringify(context, null, 2))}</pre>
          </div>
        `
            : ''
        }

        <div style="background: #1a1f3a; padding: 20px; border-radius: 8px;">
          <div style="color: #f59e0b; font-weight: bold; margin-bottom: 10px;">
            Troubleshooting Tips
          </div>
          <ul style="color: #aaa; line-height: 1.8; padding-left: 20px;">
            <li>Check the browser console for additional details</li>
            <li>Verify the CD48 device is connected and powered on</li>
            <li>Ensure you're using a supported browser (Chrome, Edge, Opera)</li>
            <li>Check the <a href="../TROUBLESHOOTING.md" style="color: #3b82f6;">Troubleshooting Guide</a></li>
          </ul>
        </div>

        ${
          this.errors.length > 1
            ? `
          <div style="margin-top: 20px; color: #666;">
            Total errors in this session: ${this.errors.length}
          </div>
        `
            : ''
        }
      </div>
    `;

    if (this.overlay) {
      this.overlay.innerHTML = errorHTML;
      this.overlay.style.display = 'block';
    }

    // Close on ESC key
    const closeHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', closeHandler);
      }
    };
    document.addEventListener('keydown', closeHandler);
  }

  /**
   * Hide error overlay
   */
  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
    this.hide();
  }

  /**
   * Escape HTML for safe display
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Performance monitor for tracking metrics
 */
export class PerformanceMonitor {
  private metrics: Record<string, number[]>;
  private marks: Record<string, number>;

  constructor() {
    this.metrics = {};
    this.marks = {};
  }

  /**
   * Start a performance measurement
   * @param name - Measurement name
   */
  start(name: string): void {
    this.marks[name] = performance.now();
  }

  /**
   * End a performance measurement
   * @param name - Measurement name
   * @returns Duration in milliseconds
   */
  end(name: string): number {
    const startMark = this.marks[name];
    if (startMark === undefined) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startMark;
    delete this.marks[name];

    const existingMetrics = this.metrics[name];
    if (!existingMetrics) {
      this.metrics[name] = [];
    }
    this.metrics[name]?.push(duration);

    return duration;
  }

  /**
   * Get statistics for a metric
   * @param name - Metric name
   * @returns Statistics
   */
  getStats(name: string): PerformanceStats | null {
    const values = this.metrics[name];
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      count: values.length,
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)] ?? 0,
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      p95: sorted[p95Index] ?? 0,
      p99: sorted[p99Index] ?? 0,
    };
  }

  /**
   * Get all metrics
   * @returns All metrics with statistics
   */
  getAllStats(): Record<string, PerformanceStats | null> {
    const stats: Record<string, PerformanceStats | null> = {};
    for (const name in this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = {};
    this.marks = {};
  }

  /**
   * Print performance report
   */
  report(): void {
    console.table(this.getAllStats());
  }
}

/**
 * Setup global error handlers for development
 * @param options - Configuration options
 */
export function setupDevMode(
  options: SetupDevModeOptions = {}
): DevModeUtilities {
  const logger = new DevLogger(options.logger);
  const errorOverlay = new ErrorOverlay();
  const perfMonitor = new PerformanceMonitor();

  // Handle unhandled errors
  window.addEventListener('error', (event: ErrorEvent) => {
    logger.error('Unhandled error:', event.error);
    if (options.showOverlay !== false) {
      const error =
        event.error instanceof Error
          ? event.error
          : new Error(String(event.error));
      errorOverlay.show(error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', event.reason);
      if (options.showOverlay !== false) {
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));
        errorOverlay.show(error, {
          type: 'Promise Rejection',
        });
      }
    }
  );

  // Expose utilities globally for console access
  if (options.exposeGlobally !== false) {
    window.__DEV__ = {
      logger,
      errorOverlay,
      perfMonitor,
      version: '1.0.0',
    };
    logger.info('Dev mode enabled. Access utilities via window.__DEV__');
  }

  return { logger, errorOverlay, perfMonitor };
}

export default {
  DevLogger,
  ErrorOverlay,
  PerformanceMonitor,
  setupDevMode,
};
