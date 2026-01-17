/**
 * @fileoverview Calibration support for CD48 including storage and wizard
 * @module calibration
 */

/**
 * Calibration profile class
 */
export class CalibrationProfile {
  /**
   * Create a calibration profile
   * @param {Object} options - Profile options
   * @param {string} options.name - Profile name
   * @param {string} [options.description] - Profile description
   * @param {Date} [options.date] - Calibration date
   */
  constructor(options = {}) {
    this.name = options.name || 'Untitled Profile';
    this.description = options.description || '';
    this.date = options.date || new Date();
    this.voltages = {}; // Channel voltage calibrations
    this.thresholds = {}; // Channel threshold calibrations
    this.gains = {}; // Channel gain calibrations
    this.offsets = {}; // Channel offset calibrations
    this.metadata = {}; // Additional metadata
  }

  /**
   * Set voltage calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @param {number} voltage - Calibrated voltage value
   */
  setVoltage(channel, voltage) {
    if (channel < 0 || channel > 7) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.voltages[channel] = voltage;
  }

  /**
   * Get voltage calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @returns {number|null} Calibrated voltage or null if not set
   */
  getVoltage(channel) {
    return this.voltages[channel] || null;
  }

  /**
   * Set threshold calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @param {number} threshold - Threshold value
   */
  setThreshold(channel, threshold) {
    if (channel < 0 || channel > 7) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.thresholds[channel] = threshold;
  }

  /**
   * Get threshold calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @returns {number|null} Threshold value or null if not set
   */
  getThreshold(channel) {
    return this.thresholds[channel] || null;
  }

  /**
   * Set gain calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @param {number} gain - Gain value
   */
  setGain(channel, gain) {
    if (channel < 0 || channel > 7) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.gains[channel] = gain;
  }

  /**
   * Get gain calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @returns {number|null} Gain value or null if not set
   */
  getGain(channel) {
    return this.gains[channel] || null;
  }

  /**
   * Set offset calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @param {number} offset - Offset value
   */
  setOffset(channel, offset) {
    if (channel < 0 || channel > 7) {
      throw new Error('Channel must be between 0 and 7');
    }
    this.offsets[channel] = offset;
  }

  /**
   * Get offset calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @returns {number|null} Offset value or null if not set
   */
  getOffset(channel) {
    return this.offsets[channel] || null;
  }

  /**
   * Apply calibration to raw count data
   * @param {number} channel - Channel number (0-7)
   * @param {number} rawCount - Raw count value
   * @returns {number} Calibrated count value
   */
  applyCounts(channel, rawCount) {
    const gain = this.gains[channel] || 1;
    const offset = this.offsets[channel] || 0;
    return rawCount * gain + offset;
  }

  /**
   * Export profile to JSON
   * @returns {Object} Profile data
   */
  toJSON() {
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
   * @param {Object} data - Profile data
   * @returns {CalibrationProfile} New profile instance
   */
  static fromJSON(data) {
    const profile = new CalibrationProfile({
      name: data.name,
      description: data.description,
      date: new Date(data.date),
    });
    profile.voltages = data.voltages || {};
    profile.thresholds = data.thresholds || {};
    profile.gains = data.gains || {};
    profile.offsets = data.offsets || {};
    profile.metadata = data.metadata || {};
    return profile;
  }
}

/**
 * Calibration storage manager using localStorage
 */
export class CalibrationStorage {
  constructor(storageKey = 'cd48_calibration_profiles') {
    this.storageKey = storageKey;
  }

  /* eslint-disable no-undef */

  /**
   * Save a calibration profile
   * @param {CalibrationProfile} profile - Profile to save
   */
  save(profile) {
    const profiles = this.loadAll();
    profiles[profile.name] = profile.toJSON();
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
  }

  /**
   * Load a calibration profile by name
   * @param {string} name - Profile name
   * @returns {CalibrationProfile|null} Profile or null if not found
   */
  load(name) {
    const profiles = this.loadAll();
    if (profiles[name]) {
      return CalibrationProfile.fromJSON(profiles[name]);
    }
    return null;
  }

  /**
   * Load all calibration profiles
   * @returns {Object} All profiles as plain objects
   */
  loadAll() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Get list of all profile names
   * @returns {string[]} Array of profile names
   */
  listProfiles() {
    return Object.keys(this.loadAll());
  }

  /**
   * Delete a calibration profile
   * @param {string} name - Profile name
   */
  delete(name) {
    const profiles = this.loadAll();
    delete profiles[name];
    localStorage.setItem(this.storageKey, JSON.stringify(profiles));
  }

  /**
   * Clear all calibration profiles
   */
  clear() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Export all profiles to JSON string
   * @returns {string} JSON string of all profiles
   */
  export() {
    return JSON.stringify(this.loadAll(), null, 2);
  }

  /**
   * Import profiles from JSON string
   * @param {string} jsonString - JSON string of profiles
   * @param {boolean} [merge=false] - Merge with existing profiles
   */
  import(jsonString, merge = false) {
    const imported = JSON.parse(jsonString);
    if (merge) {
      const existing = this.loadAll();
      const merged = { ...existing, ...imported };
      localStorage.setItem(this.storageKey, JSON.stringify(merged));
    } else {
      localStorage.setItem(this.storageKey, JSON.stringify(imported));
    }
  }

  /* eslint-enable no-undef */
}

/**
 * Voltage calibration utilities
 */
export class VoltageCalibration {
  /**
   * Perform two-point calibration
   * @param {Object} point1 - First calibration point {raw, actual}
   * @param {Object} point2 - Second calibration point {raw, actual}
   * @returns {Object} Calibration coefficients {gain, offset}
   */
  static twoPoint(point1, point2) {
    const gain = (point2.actual - point1.actual) / (point2.raw - point1.raw);
    const offset = point1.actual - gain * point1.raw;
    return { gain, offset };
  }

  /**
   * Apply calibration to raw value
   * @param {number} raw - Raw value
   * @param {number} gain - Gain coefficient
   * @param {number} offset - Offset coefficient
   * @returns {number} Calibrated value
   */
  static apply(raw, gain, offset) {
    return raw * gain + offset;
  }

  /**
   * Perform multi-point calibration using least squares
   * @param {Array<{raw: number, actual: number}>} points - Calibration points
   * @returns {Object} Calibration coefficients {gain, offset}
   */
  static multiPoint(points) {
    if (points.length < 2) {
      throw new Error('At least 2 calibration points required');
    }

    const n = points.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    points.forEach((point) => {
      sumX += point.raw;
      sumY += point.actual;
      sumXY += point.raw * point.actual;
      sumXX += point.raw * point.raw;
    });

    const gain = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const offset = (sumY - gain * sumX) / n;

    return { gain, offset };
  }

  /**
   * Calculate calibration error
   * @param {Array<{raw: number, actual: number}>} points - Test points
   * @param {number} gain - Gain coefficient
   * @param {number} offset - Offset coefficient
   * @returns {Object} Error statistics {mean, std, max}
   */
  static calculateError(points, gain, offset) {
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
  /**
   * Create a calibration wizard
   * @param {Object} cd48 - CD48 device instance
   */
  constructor(cd48) {
    this.cd48 = cd48;
    this.profile = new CalibrationProfile();
    this.storage = new CalibrationStorage();
    this.currentStep = 0;
    this.calibrationData = {};
  }

  /**
   * Start voltage calibration for a channel
   * @param {number} channel - Channel number (0-7)
   * @param {number} duration - Measurement duration in seconds
   * @returns {Promise<number>} Average count rate
   */
  async measureChannelRate(channel, duration = 5.0) {
    if (!this.cd48 || !this.cd48.isConnected()) {
      throw new Error('CD48 device not connected');
    }

    const result = await this.cd48.measureRate(channel, duration);
    return result.rate;
  }

  /**
   * Perform automatic background measurement
   * @param {number[]} channels - Channels to measure
   * @param {number} duration - Measurement duration
   * @returns {Promise<Object>} Background rates for each channel
   */
  async measureBackground(channels, duration = 10.0) {
    const backgrounds = {};

    for (const channel of channels) {
      const rate = await this.measureChannelRate(channel, duration);
      backgrounds[channel] = rate;
      this.profile.metadata[`background_ch${channel}`] = rate;
    }

    return backgrounds;
  }

  /**
   * Calibrate channel voltage
   * @param {number} channel - Channel number
   * @param {number} knownVoltage - Known voltage value
   * @returns {Promise<void>}
   */
  async calibrateVoltage(channel, knownVoltage) {
    this.profile.setVoltage(channel, knownVoltage);
    this.profile.metadata[`voltage_calibrated_ch${channel}`] = true;
  }

  /**
   * Auto-calibrate gain using reference source
   * @param {number} channel - Channel number
   * @param {number} referenceRate - Known reference rate
   * @param {number} duration - Measurement duration
   * @returns {Promise<number>} Calculated gain
   */
  async calibrateGain(channel, referenceRate, duration = 10.0) {
    const measuredRate = await this.measureChannelRate(channel, duration);
    const gain = referenceRate / measuredRate;
    this.profile.setGain(channel, gain);
    return gain;
  }

  /**
   * Find optimal threshold for a channel
   * @param {number} channel - Channel number
   * @param {number[]} testThresholds - Array of threshold values to test
   * @param {number} duration - Measurement duration per threshold
   * @returns {Promise<Object>} Optimal threshold and rate data
   */
  async findOptimalThreshold(channel, testThresholds, duration = 5.0) {
    const results = [];

    for (const threshold of testThresholds) {
      // Note: CD48 doesn't have threshold adjustment, but this shows the pattern
      // In a real implementation, you'd adjust hardware settings
      const rate = await this.measureChannelRate(channel, duration);
      results.push({ threshold, rate });
    }

    // Find plateau region (where rate is stable)
    let optimalThreshold = testThresholds[0];
    let maxRate = 0;

    results.forEach((result) => {
      if (result.rate > maxRate * 0.95 && result.rate < maxRate * 1.05) {
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
   * @param {string} name - Profile name
   */
  save(name) {
    if (name) this.profile.name = name;
    this.storage.save(this.profile);
  }

  /**
   * Load a calibration profile
   * @param {string} name - Profile name
   * @returns {CalibrationProfile|null} Loaded profile
   */
  load(name) {
    const profile = this.storage.load(name);
    if (profile) {
      this.profile = profile;
    }
    return profile;
  }

  /**
   * Generate calibration report
   * @returns {Object} Calibration report data
   */
  generateReport() {
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
   * @returns {Object} Validation results
   */
  validate() {
    const issues = [];
    const warnings = [];

    // Check for missing calibrations
    for (let i = 0; i < 8; i++) {
      if (this.profile.getVoltage(i) === null) {
        warnings.push(`Channel ${i} voltage not calibrated`);
      }
      if (this.profile.getGain(i) === null) {
        warnings.push(`Channel ${i} gain not calibrated`);
      }
    }

    // Check for unreasonable values
    for (let i = 0; i < 8; i++) {
      const gain = this.profile.getGain(i);
      if (gain !== null && (gain < 0.1 || gain > 10)) {
        issues.push(`Channel ${i} gain ${gain} is unusual (expected 0.1-10)`);
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
