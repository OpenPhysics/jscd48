/**
 * TypeScript definitions for CD48 Coincidence Counter
 */

export interface CD48Options {
  /**
   * Baud rate for serial communication (default: 115200)
   */
  baudRate?: number;

  /**
   * Delay after commands in milliseconds (default: 50)
   */
  commandDelay?: number;
}

export interface CountData {
  /**
   * Array of 8 channel counts
   */
  counts: number[];

  /**
   * Overflow status flag
   */
  overflow: number;
}

export interface RateResult {
  /**
   * Number of counts measured
   */
  counts: number;

  /**
   * Measurement duration in seconds
   */
  duration: number;

  /**
   * Calculated rate in Hz
   */
  rate: number;

  /**
   * Channel number (0-7)
   */
  channel: number;
}

export interface ChannelInputs {
  /**
   * Enable input A (0 or 1)
   */
  A?: number;

  /**
   * Enable input B (0 or 1)
   */
  B?: number;

  /**
   * Enable input C (0 or 1)
   */
  C?: number;

  /**
   * Enable input D (0 or 1)
   */
  D?: number;
}

export interface CoincidenceMeasurementOptions {
  /**
   * Measurement duration in seconds
   */
  duration: number;

  /**
   * Channel for singles A (default: 0)
   */
  singlesAChannel?: number;

  /**
   * Channel for singles B (default: 1)
   */
  singlesBChannel?: number;

  /**
   * Channel for coincidences (default: 4)
   */
  coincidenceChannel?: number;

  /**
   * Coincidence window in seconds (default: 25e-9)
   */
  coincidenceWindow?: number;
}

export interface CoincidenceResult {
  /**
   * Singles A count
   */
  singlesA: number;

  /**
   * Singles B count
   */
  singlesB: number;

  /**
   * Coincidence count
   */
  coincidences: number;

  /**
   * Measurement duration in seconds
   */
  duration: number;

  /**
   * Singles A rate in Hz
   */
  rateA: number;

  /**
   * Singles B rate in Hz
   */
  rateB: number;

  /**
   * Measured coincidence rate in Hz
   */
  coincidenceRate: number;

  /**
   * Calculated accidental coincidence rate in Hz
   */
  accidentalRate: number;

  /**
   * True coincidence rate (measured - accidental) in Hz
   */
  trueCoincidenceRate: number;
}

/**
 * CD48 Coincidence Counter interface class
 */
export class CD48 {
  /**
   * Create a CD48 interface instance
   */
  constructor(options?: CD48Options);

  /**
   * Check if Web Serial API is supported in the browser
   */
  static isSupported(): boolean;

  /**
   * Convert byte value to voltage
   * @param byteValue - Raw byte value (0-255)
   * @returns Voltage (0.0 to 4.08V)
   */
  static byteToVoltage(byteValue: number): number;

  /**
   * Connect to the CD48 device
   * Opens a serial port picker dialog for the user
   * @returns True if connected successfully
   */
  connect(): Promise<boolean>;

  /**
   * Disconnect from the CD48 device
   */
  disconnect(): Promise<void>;

  /**
   * Check if connected to device
   */
  isConnected(): boolean;

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  sleep(ms: number): Promise<void>;

  /**
   * Send a command and read the response
   * @param command - Command to send
   * @returns Response from device
   */
  sendCommand(command: string): Promise<string>;

  /**
   * Get firmware version
   */
  getVersion(): Promise<string>;

  /**
   * Get help text from device
   */
  getHelp(): Promise<string>;

  /**
   * Get current counts from all channels
   * @param humanReadable - If true, returns formatted string
   */
  getCounts(humanReadable?: false): Promise<CountData>;
  getCounts(humanReadable: true): Promise<string>;

  /**
   * Clear all counters by reading them
   */
  clearCounts(): Promise<void>;

  /**
   * Get current settings
   * @param humanReadable - If true, returns formatted string
   */
  getSettings(humanReadable?: boolean): Promise<string>;

  /**
   * Configure a counter channel
   * @param channel - Channel number (0-7)
   * @param inputs - Input configuration
   */
  setChannel(channel: number, inputs?: ChannelInputs): Promise<string>;

  /**
   * Set trigger level voltage
   * @param voltage - Voltage threshold (0.0 to 4.08V)
   */
  setTriggerLevel(voltage: number): Promise<string>;

  /**
   * Set input impedance to 50 Ohms
   */
  setImpedance50Ohm(): Promise<string>;

  /**
   * Set input impedance to High-Z
   */
  setImpedanceHighZ(): Promise<string>;

  /**
   * Set automatic repeat interval
   * @param intervalMs - Interval in milliseconds (100-65535)
   */
  setRepeat(intervalMs: number): Promise<string>;

  /**
   * Toggle automatic repeat mode
   */
  toggleRepeat(): Promise<string>;

  /**
   * Set DAC output voltage
   * @param voltage - Output voltage (0.0 to 4.08V)
   */
  setDacVoltage(voltage: number): Promise<string>;

  /**
   * Get and clear overflow status
   * @returns 8-bit overflow flag
   */
  getOverflow(): Promise<number>;

  /**
   * Test all LEDs (lights for 1 second)
   */
  testLeds(): Promise<string>;

  /**
   * Measure count rate on a channel
   * @param channel - Channel number (0-7)
   * @param duration - Measurement duration in seconds
   */
  measureRate(channel?: number, duration?: number): Promise<RateResult>;

  /**
   * Measure coincidence rate with accidental correction
   * @param options - Measurement options
   */
  measureCoincidenceRate(
    options?: CoincidenceMeasurementOptions
  ): Promise<CoincidenceResult>;
}

export default CD48;
