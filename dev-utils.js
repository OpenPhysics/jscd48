/**
 * @fileoverview Development utilities for enhanced debugging and error handling
 * @module dev-utils
 */

/* eslint-disable no-undef */

/**
 * Development logger with enhanced formatting and filtering
 */
export class DevLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.level = options.level || 'debug'; // 'debug', 'info', 'warn', 'error'
    this.prefix = options.prefix || '[CD48]';
    this.timestamps = options.timestamps !== false;
    this.colors = {
      debug: '#6366f1',
      info: '#3b82f6',
      warn: '#f59e0b',
      error: '#ef4444',
      success: '#10b981',
    };
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this.minLevel = this.levels[this.level] || 0;
  }

  /**
   * Format timestamp
   * @private
   */
  getTimestamp() {
    if (!this.timestamps) return '';
    const now = new Date();
    return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
  }

  /**
   * Log debug message
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if (!this.enabled || this.minLevel > this.levels.debug) return;
    console.log(
      `%c${this.getTimestamp()} ${this.prefix} [DEBUG]`,
      `color: ${this.colors.debug}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log info message
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if (!this.enabled || this.minLevel > this.levels.info) return;
    console.log(
      `%c${this.getTimestamp()} ${this.prefix} [INFO]`,
      `color: ${this.colors.info}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log warning message
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if (!this.enabled || this.minLevel > this.levels.warn) return;
    console.warn(
      `%c${this.getTimestamp()} ${this.prefix} [WARN]`,
      `color: ${this.colors.warn}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log error message
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (!this.enabled) return;
    console.error(
      `%c${this.getTimestamp()} ${this.prefix} [ERROR]`,
      `color: ${this.colors.error}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log success message
   * @param {...any} args - Arguments to log
   */
  success(...args) {
    if (!this.enabled || this.minLevel > this.levels.info) return;
    console.log(
      `%c${this.getTimestamp()} ${this.prefix} [SUCCESS]`,
      `color: ${this.colors.success}; font-weight: bold`,
      ...args
    );
  }

  /**
   * Log with custom styling
   * @param {string} message - Message to log
   * @param {string} style - CSS style string
   */
  custom(message, style) {
    if (!this.enabled) return;
    console.log(`%c${this.getTimestamp()} ${this.prefix} ${message}`, style);
  }

  /**
   * Create a timer
   * @param {string} label - Timer label
   * @returns {Function} Function to end timer
   */
  time(label) {
    if (!this.enabled) return () => {};
    const startTime = performance.now();
    this.debug(`⏱️  Timer started: ${label}`);
    return () => {
      const duration = (performance.now() - startTime).toFixed(2);
      this.debug(`⏱️  Timer ended: ${label} - ${duration}ms`);
      return duration;
    };
  }

  /**
   * Log object in table format
   * @param {Object} obj - Object to log
   */
  table(obj) {
    if (!this.enabled) return;
    console.table(obj);
  }

  /**
   * Group related logs
   * @param {string} label - Group label
   * @param {Function} fn - Function containing logs
   */
  group(label, fn) {
    if (!this.enabled) return fn();
    console.group(`${this.getTimestamp()} ${this.prefix} ${label}`);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }
}

/**
 * Error overlay for displaying runtime errors
 */
export class ErrorOverlay {
  constructor() {
    this.overlay = null;
    this.errors = [];
  }

  /**
   * Create overlay DOM element
   * @private
   */
  createOverlay() {
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
   * @param {Error} error - Error to display
   * @param {Object} context - Additional context
   */
  show(error, context = {}) {
    this.createOverlay();
    this.errors.push({ error, context, timestamp: new Date() });

    const errorHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h1 style="color: #ef4444; margin: 0; font-size: 24px;">
            ⚠️ Runtime Error
          </h1>
          <button onclick="this.getRootNode().host.parentElement.style.display='none'"
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
            💡 Troubleshooting Tips
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

    this.overlay.innerHTML = errorHTML;
    this.overlay.style.display = 'block';

    // Close on ESC key
    const closeHandler = (e) => {
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
  hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
    this.hide();
  }

  /**
   * Escape HTML for safe display
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Performance monitor for tracking metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.marks = {};
  }

  /**
   * Start a performance measurement
   * @param {string} name - Measurement name
   */
  start(name) {
    this.marks[name] = performance.now();
  }

  /**
   * End a performance measurement
   * @param {string} name - Measurement name
   * @returns {number} Duration in milliseconds
   */
  end(name) {
    if (!this.marks[name]) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - this.marks[name];
    delete this.marks[name];

    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    this.metrics[name].push(duration);

    return duration;
  }

  /**
   * Get statistics for a metric
   * @param {string} name - Metric name
   * @returns {Object} Statistics
   */
  getStats(name) {
    const values = this.metrics[name];
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      mean: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics with statistics
   */
  getAllStats() {
    const stats = {};
    for (const name in this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {};
    this.marks = {};
  }

  /**
   * Print performance report
   */
  report() {
    console.table(this.getAllStats());
  }
}

/**
 * Setup global error handlers for development
 * @param {Object} options - Configuration options
 */
export function setupDevMode(options = {}) {
  const logger = new DevLogger(options.logger);
  const errorOverlay = new ErrorOverlay();
  const perfMonitor = new PerformanceMonitor();

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error:', event.error);
    if (options.showOverlay !== false) {
      errorOverlay.show(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
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
  });

  // Expose utilities globally for console access
  if (options.exposeGlobally !== false) {
    window.__DEV__ = {
      logger,
      errorOverlay,
      perfMonitor,
      version: '1.0.0',
    };
    logger.info('🛠️  Dev mode enabled. Access utilities via window.__DEV__');
  }

  return { logger, errorOverlay, perfMonitor };
}

export default {
  DevLogger,
  ErrorOverlay,
  PerformanceMonitor,
  setupDevMode,
};
