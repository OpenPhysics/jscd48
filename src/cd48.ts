/**
 * CD48 Coincidence Counter - Web Serial API Interface
 *
 * A TypeScript library for controlling the Red Dog Physics CD48
 * Coincidence Counter via the Web Serial API.
 *
 * Requires Chrome 89+ or Edge 89+
 *
 * @example
 * const cd48 = new CD48();
 * await cd48.connect();
 * const version = await cd48.getVersion();
 * console.log('Firmware:', version);
 * const counts = await cd48.getCounts();
 * console.log('Counts:', counts);
 * await cd48.disconnect();
 */

import {
  UnsupportedBrowserError,
  NotConnectedError,
  ConnectionError,
  DeviceSelectionCancelledError,
  CommandTimeoutError,
  InvalidResponseError,
  CommunicationError,
} from './errors.js';

import {
  validateChannel,
  voltageToByte,
  VOLTAGE_MAX,
  BYTE_MAX,
  REPEAT_INTERVAL_MIN,
  REPEAT_INTERVAL_MAX,
} from './validation.js';

import {
  BAUD_RATE,
  COMMAND_DELAY_MS,
  RECONNECT_ATTEMPTS,
  RECONNECT_DELAY_MS,
  USB_VENDOR_ID,
  CONNECTION_INIT_DELAY_MS,
  COMMAND_TIMEOUT_MS,
  READ_TIMEOUT_INTERVAL_MS,
  EXPECTED_CHANNEL_COUNT,
  EXPECTED_COUNT_RESPONSE_LENGTH,
  DECIMAL_RADIX,
  COINCIDENCE_WINDOW_SECONDS,
  ACCIDENTAL_RATE_MULTIPLIER,
  DEFAULT_SINGLES_A_CHANNEL,
  DEFAULT_SINGLES_B_CHANNEL,
  DEFAULT_COINCIDENCE_CHANNEL,
  DEFAULT_MEASUREMENT_DURATION,
  MILLISECONDS_PER_SECOND,
  PERCENT_CONVERSION,
} from './constants.js';

/**
 * CD48 configuration options
 */
export interface CD48Options {
  /** Baud rate (default: 115200) */
  baudRate?: number;
  /** Delay after commands in ms (default: 50) */
  commandDelay?: number;
  /** Enable auto-reconnection (default: false) */
  autoReconnect?: boolean;
  /** Max reconnection attempts (default: 3) */
  reconnectAttempts?: number;
  /** Delay between reconnect attempts in ms (default: 1000) */
  reconnectDelay?: number;
  /** Minimum ms between commands (default: 0) */
  rateLimitMs?: number;
}

/**
 * Channel input configuration
 */
export interface ChannelInputs {
  A?: 0 | 1;
  B?: 0 | 1;
  C?: 0 | 1;
  D?: 0 | 1;
}

/**
 * Count data from device
 */
export interface CountData {
  counts: number[];
  overflow: number;
}

/**
 * Measurement uncertainty data
 */
export interface MeasurementUncertainty {
  counts: number;
  rate: number;
  relative: number;
}

/**
 * Rate measurement result
 */
export interface RateMeasurement {
  counts: number;
  duration: number;
  rate: number;
  channel: number;
  uncertainty: MeasurementUncertainty;
}

/**
 * Coincidence measurement uncertainty
 */
export interface CoincidenceUncertainty {
  singlesA: number;
  singlesB: number;
  coincidences: number;
  rateA: number;
  rateB: number;
  coincidenceRate: number;
  accidentalRate: number;
  trueCoincidenceRate: number;
}

/**
 * Coincidence measurement options
 */
export interface CoincidenceMeasurementOptions {
  /** Measurement duration in seconds */
  duration?: number;
  /** Channel for singles A (default: 0) */
  singlesAChannel?: number;
  /** Channel for singles B (default: 1) */
  singlesBChannel?: number;
  /** Channel for coincidences (default: 4) */
  coincidenceChannel?: number;
  /** Window in seconds (default: 25e-9) */
  coincidenceWindow?: number;
}

/**
 * Coincidence measurement result
 */
export interface CoincidenceMeasurement {
  singlesA: number;
  singlesB: number;
  coincidences: number;
  duration: number;
  rateA: number;
  rateB: number;
  coincidenceRate: number;
  accidentalRate: number;
  trueCoincidenceRate: number;
  uncertainty: CoincidenceUncertainty;
}

/**
 * Disconnect callback type
 */
export type DisconnectCallback = () => void;

/**
 * Reconnect callback type
 */
export type ReconnectCallback = () => void;

/**
 * Read result with timeout flag
 */
interface ReadResult {
  value: string;
  done: boolean;
  timeout?: boolean;
}

/**
 * CD48 Coincidence Counter interface class
 */
class CD48 {
  private readonly baudRate: number;
  private readonly commandDelay: number;
  private readonly autoReconnect: boolean;
  private readonly reconnectAttempts: number;
  private readonly reconnectDelay: number;
  private readonly rateLimitMs: number;
  private port: SerialPort | null;
  private reader: ReadableStreamDefaultReader<string> | null;
  private writer: WritableStreamDefaultWriter<string> | null;
  private readableStreamClosed: Promise<void> | null;
  private writableStreamClosed: Promise<void> | null;
  private _lastCommandTime: number;
  private _reconnecting: boolean;
  private _onDisconnect: DisconnectCallback | null;
  private _onReconnect: ReconnectCallback | null;

  /**
   * Create a CD48 interface instance.
   * @param options - Configuration options
   */
  constructor(options: CD48Options = {}) {
    this.baudRate = options.baudRate ?? BAUD_RATE;
    this.commandDelay = options.commandDelay ?? COMMAND_DELAY_MS;
    this.autoReconnect = options.autoReconnect ?? false;
    this.reconnectAttempts = options.reconnectAttempts ?? RECONNECT_ATTEMPTS;
    this.reconnectDelay = options.reconnectDelay ?? RECONNECT_DELAY_MS;
    this.rateLimitMs = options.rateLimitMs ?? 0;
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.readableStreamClosed = null;
    this.writableStreamClosed = null;
    this._lastCommandTime = 0;
    this._reconnecting = false;
    this._onDisconnect = null;
    this._onReconnect = null;
  }

  /**
   * Set callback for disconnect events.
   * @param callback - Function called on disconnect
   */
  onDisconnect(callback: DisconnectCallback): void {
    this._onDisconnect = callback;
  }

  /**
   * Set callback for reconnect events.
   * @param callback - Function called on successful reconnect
   */
  onReconnect(callback: ReconnectCallback): void {
    this._onReconnect = callback;
  }

  /**
   * Check if Web Serial API is supported.
   * @returns True if supported
   */
  static isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Connect to the CD48 device.
   * Opens a serial port picker dialog for the user.
   * @returns True if connected successfully
   */
  async connect(): Promise<boolean> {
    if (!CD48.isSupported()) {
      throw new UnsupportedBrowserError();
    }

    try {
      // Request port with Cypress VID filter
      this.port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: USB_VENDOR_ID }], // Cypress Semiconductor
      });

      await this._setupConnection();
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        throw new DeviceSelectionCancelledError();
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCause = error instanceof Error ? error : undefined;
      throw new ConnectionError(errorMessage, errorCause);
    }
  }

  /**
   * Set up connection streams after port is opened.
   */
  private async _setupConnection(): Promise<void> {
    if (this.port === null) {
      throw new ConnectionError('No port available');
    }

    await this.port.open({ baudRate: this.baudRate });

    // Set up reader and writer
    const textDecoder = new TextDecoderStream();
    const readable = this.port.readable;
    if (readable === null) {
      throw new ConnectionError('Port readable stream not available');
    }
    /**
     * Type assertions needed here because Web Serial API uses BufferSource
     * but TextDecoderStream expects Uint8Array. They're compatible at runtime
     * since BufferSource = ArrayBuffer | ArrayBufferView (which includes Uint8Array)
     */
    this.readableStreamClosed = (readable as ReadableStream<Uint8Array>).pipeTo(
      textDecoder.writable as WritableStream<Uint8Array>
    );
    this.reader = textDecoder.readable.getReader();

    const textEncoder = new TextEncoderStream();
    const writable = this.port.writable;
    if (writable === null) {
      throw new ConnectionError('Port writable stream not available');
    }
    this.writableStreamClosed = textEncoder.readable.pipeTo(
      writable as WritableStream<Uint8Array>
    );
    this.writer = textEncoder.writable.getWriter();

    // Wait for device to initialize
    await this.sleep(CONNECTION_INIT_DELAY_MS);
  }

  /**
   * Attempt to reconnect to the device.
   * @returns True if reconnected successfully
   */
  async reconnect(): Promise<boolean> {
    if (this._reconnecting) {
      return false;
    }

    this._reconnecting = true;

    try {
      // Clean up existing connection
      await this._cleanupConnection();

      // Get previously granted ports
      const ports = await navigator.serial.getPorts();
      const cd48Port = ports.find((p) => {
        const info = p.getInfo();
        return info.usbVendorId === USB_VENDOR_ID;
      });

      if (cd48Port === undefined) {
        throw new ConnectionError('No previously connected CD48 device found');
      }

      this.port = cd48Port;
      await this._setupConnection();

      if (this._onReconnect !== null) {
        this._onReconnect();
      }

      return true;
    } finally {
      this._reconnecting = false;
    }
  }

  /**
   * Attempt auto-reconnection with retries.
   * @returns True if reconnected successfully
   */
  private async _attemptAutoReconnect(): Promise<boolean> {
    if (!this.autoReconnect || this._reconnecting) {
      return false;
    }

    for (let attempt = 1; attempt <= this.reconnectAttempts; attempt++) {
      try {
        await this.sleep(this.reconnectDelay * attempt);
        const success = await this.reconnect();
        if (success) {
          return true;
        }
      } catch {
        // Continue to next attempt
      }
    }

    return false;
  }

  /**
   * Clean up connection resources.
   */
  private async _cleanupConnection(): Promise<void> {
    if (this.reader !== null) {
      try {
        await this.reader.cancel();
        if (this.readableStreamClosed !== null) {
          await this.readableStreamClosed.catch(() => {});
        }
      } catch {
        // Ignore cleanup errors
      }
      this.reader = null;
    }
    if (this.writer !== null) {
      try {
        await this.writer.close();
        if (this.writableStreamClosed !== null) {
          await this.writableStreamClosed;
        }
      } catch {
        // Ignore cleanup errors
      }
      this.writer = null;
    }
    if (this.port !== null) {
      try {
        await this.port.close();
      } catch {
        // Ignore cleanup errors
      }
      this.port = null;
    }
  }

  /**
   * Disconnect from the CD48 device.
   */
  async disconnect(): Promise<void> {
    await this._cleanupConnection();
    if (this._onDisconnect !== null) {
      this._onDisconnect();
    }
  }

  /**
   * Check if connected to device.
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.port !== null && this.reader !== null;
  }

  /**
   * Sleep for specified milliseconds.
   * @param ms - Milliseconds to sleep
   */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Apply rate limiting between commands.
   */
  private async _applyRateLimit(): Promise<void> {
    if (this.rateLimitMs > 0) {
      const elapsed = Date.now() - this._lastCommandTime;
      if (elapsed < this.rateLimitMs) {
        await this.sleep(this.rateLimitMs - elapsed);
      }
    }
    this._lastCommandTime = Date.now();
  }

  /**
   * Send a command and read the response.
   * @param command - Command to send
   * @returns Response from device
   */
  async sendCommand(command: string): Promise<string> {
    if (!this.isConnected()) {
      // Attempt auto-reconnect if enabled
      if (this.autoReconnect) {
        const reconnected = await this._attemptAutoReconnect();
        if (!reconnected) {
          throw new NotConnectedError('sendCommand');
        }
      } else {
        throw new NotConnectedError('sendCommand');
      }
    }

    // Apply rate limiting
    await this._applyRateLimit();

    try {
      if (this.writer === null || this.reader === null) {
        throw new NotConnectedError('sendCommand');
      }

      // Clear any pending data
      await this.writer.write(command + '\r');
      await this.sleep(this.commandDelay);

      // Read response with timeout
      let response = '';
      const startTime = Date.now();
      const timeout = COMMAND_TIMEOUT_MS;

      while (Date.now() - startTime < timeout) {
        const readPromise: Promise<ReadResult> = this.reader
          .read()
          .then((result) => ({ value: result.value ?? '', done: result.done }));
        const timeoutPromise: Promise<ReadResult> = this.sleep(
          READ_TIMEOUT_INTERVAL_MS
        ).then(() => ({
          value: '',
          done: false,
          timeout: true,
        }));

        const result = await Promise.race([readPromise, timeoutPromise]);

        if (result.done) break;
        if (result.value !== '') response += result.value;

        // Check if we have a complete response
        if (response.includes('\r') || response.includes('\n')) {
          break;
        }
      }

      // Check if we timed out
      if (Date.now() - startTime >= timeout && response === '') {
        throw new CommandTimeoutError(command, timeout);
      }

      return response.trim();
    } catch (error) {
      if (
        error instanceof CommandTimeoutError ||
        error instanceof NotConnectedError
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCause = error instanceof Error ? error : undefined;
      throw new CommunicationError(errorMessage, errorCause);
    }
  }

  /**
   * Get firmware version.
   * @returns Firmware version string
   */
  async getVersion(): Promise<string> {
    return await this.sendCommand('v');
  }

  /**
   * Get help text from device.
   * @returns Help text
   */
  async getHelp(): Promise<string> {
    return await this.sendCommand('H');
  }

  /**
   * Get current counts from all channels.
   * @param humanReadable - If true, returns formatted string
   * @returns Counts data or formatted string
   */
  async getCounts(humanReadable: true): Promise<string>;
  async getCounts(humanReadable?: false): Promise<CountData>;
  async getCounts(humanReadable = false): Promise<CountData | string> {
    if (humanReadable) {
      return await this.sendCommand('C');
    }

    const response = await this.sendCommand('c');
    const parts = response.split(/\s+/).filter((p) => p.length > 0);

    if (parts.length >= EXPECTED_COUNT_RESPONSE_LENGTH) {
      return {
        counts: parts.slice(0, EXPECTED_CHANNEL_COUNT).map(Number),
        overflow: parseInt(parts[EXPECTED_CHANNEL_COUNT] ?? '0', DECIMAL_RADIX),
      };
    }

    throw new InvalidResponseError(
      response,
      `${EXPECTED_CHANNEL_COUNT} counts + overflow flag`
    );
  }

  /**
   * Clear all counters by reading them.
   */
  async clearCounts(): Promise<void> {
    await this.getCounts(false);
  }

  /**
   * Get current settings.
   * @param humanReadable - If true, returns formatted string
   * @returns Settings string
   */
  async getSettings(humanReadable = true): Promise<string> {
    return await this.sendCommand(humanReadable ? 'P' : 'p');
  }

  /**
   * Configure a counter channel.
   * @param channel - Channel number (0-7)
   * @param inputs - Input configuration
   * @returns Response from device
   */
  async setChannel(
    channel: number,
    inputs: ChannelInputs = {}
  ): Promise<string> {
    validateChannel(channel);
    const { A = 0, B = 0, C = 0, D = 0 } = inputs;
    return await this.sendCommand(`S${channel}${A}${B}${C}${D}`);
  }

  /**
   * Set trigger level voltage.
   * @param voltage - Voltage threshold (0.0 to 4.08V)
   * @returns Response from device
   */
  async setTriggerLevel(voltage: number): Promise<string> {
    // Clamp voltage to valid range instead of throwing
    const byteVal = voltageToByte(voltage);
    return await this.sendCommand(`L${byteVal}`);
  }

  /**
   * Get trigger level as voltage.
   * @param byteValue - Raw byte value (0-255)
   * @returns Voltage (0.0 to 4.08V)
   */
  static byteToVoltage(byteValue: number): number {
    return (byteValue / BYTE_MAX) * VOLTAGE_MAX;
  }

  /**
   * Set input impedance to 50 Ohms.
   * @returns Response from device
   */
  async setImpedance50Ohm(): Promise<string> {
    return await this.sendCommand('z');
  }

  /**
   * Set input impedance to High-Z.
   * @returns Response from device
   */
  async setImpedanceHighZ(): Promise<string> {
    return await this.sendCommand('Z');
  }

  /**
   * Set automatic repeat interval.
   * @param intervalMs - Interval in milliseconds (100-65535)
   * @returns Response from device
   */
  async setRepeat(intervalMs: number): Promise<string> {
    const clamped = Math.max(
      REPEAT_INTERVAL_MIN,
      Math.min(REPEAT_INTERVAL_MAX, intervalMs)
    );
    return await this.sendCommand(`r${clamped}`);
  }

  /**
   * Toggle automatic repeat mode.
   * @returns Response from device
   */
  async toggleRepeat(): Promise<string> {
    return await this.sendCommand('R');
  }

  /**
   * Set DAC output voltage.
   * @param voltage - Output voltage (0.0 to 4.08V)
   * @returns Response from device
   */
  async setDacVoltage(voltage: number): Promise<string> {
    const byteVal = Math.max(
      0,
      Math.min(BYTE_MAX, Math.round((voltage / VOLTAGE_MAX) * BYTE_MAX))
    );
    return await this.sendCommand(`V${byteVal}`);
  }

  /**
   * Get and clear overflow status.
   * @returns 8-bit overflow flag
   */
  async getOverflow(): Promise<number> {
    const response = await this.sendCommand('E');
    return parseInt(response, DECIMAL_RADIX);
  }

  /**
   * Test all LEDs (lights for 1 second).
   * @returns Response from device
   */
  async testLeds(): Promise<string> {
    return await this.sendCommand('T');
  }

  /**
   * Measure count rate on a channel with Poisson uncertainty.
   * @param channel - Channel number (0-7)
   * @param duration - Measurement duration in seconds
   * @returns Rate measurement result with uncertainties
   */
  async measureRate(
    channel = 0,
    duration = DEFAULT_MEASUREMENT_DURATION
  ): Promise<RateMeasurement> {
    validateChannel(channel);

    await this.clearCounts();
    await this.sleep(duration * MILLISECONDS_PER_SECOND);
    const data = await this.getCounts(false);
    const counts = data.counts[channel] ?? 0;
    const rate = counts / duration;

    // Poisson uncertainty: sigma_N = sqrt(N)
    const countUncertainty = Math.sqrt(Math.max(0, counts));
    // Rate uncertainty: sigma_R = sigma_N / T
    const rateUncertainty = countUncertainty / duration;
    // Relative uncertainty as percentage
    const relativeUncertainty =
      counts > 0 ? (countUncertainty / counts) * PERCENT_CONVERSION : 0;

    return {
      counts,
      duration,
      rate,
      channel,
      uncertainty: {
        counts: countUncertainty,
        rate: rateUncertainty,
        relative: relativeUncertainty,
      },
    };
  }

  /**
   * Measure coincidence rate with accidental correction and uncertainties.
   * @param options - Measurement options
   * @returns Coincidence measurement result with uncertainties
   */
  async measureCoincidenceRate(
    options: CoincidenceMeasurementOptions = {}
  ): Promise<CoincidenceMeasurement> {
    const {
      duration = DEFAULT_MEASUREMENT_DURATION,
      singlesAChannel = DEFAULT_SINGLES_A_CHANNEL,
      singlesBChannel = DEFAULT_SINGLES_B_CHANNEL,
      coincidenceChannel = DEFAULT_COINCIDENCE_CHANNEL,
      coincidenceWindow = COINCIDENCE_WINDOW_SECONDS,
    } = options;

    await this.clearCounts();
    await this.sleep(duration * MILLISECONDS_PER_SECOND);
    const data = await this.getCounts(false);

    const singlesA = data.counts[singlesAChannel] ?? 0;
    const singlesB = data.counts[singlesBChannel] ?? 0;
    const coincidences = data.counts[coincidenceChannel] ?? 0;

    const rateA = singlesA / duration;
    const rateB = singlesB / duration;
    const coincidenceRate = coincidences / duration;
    const accidentalRate =
      ACCIDENTAL_RATE_MULTIPLIER * coincidenceWindow * rateA * rateB;
    const trueCoincidenceRate = Math.max(0, coincidenceRate - accidentalRate);

    // Poisson uncertainties for counts
    const sigmaA = Math.sqrt(Math.max(0, singlesA));
    const sigmaB = Math.sqrt(Math.max(0, singlesB));
    const sigmaC = Math.sqrt(Math.max(0, coincidences));

    // Rate uncertainties
    const rateAUncertainty = sigmaA / duration;
    const rateBUncertainty = sigmaB / duration;
    const coincidenceRateUncertainty = sigmaC / duration;

    // Accidental rate uncertainty (error propagation)
    // sigma_acc = 2 * tau * sqrt((R_B * sigma_A)^2 + (R_A * sigma_B)^2) / T
    const accidentalRateUncertainty =
      ((ACCIDENTAL_RATE_MULTIPLIER * coincidenceWindow) / duration) *
      Math.sqrt(Math.pow(rateB * sigmaA, 2) + Math.pow(rateA * sigmaB, 2));

    // True coincidence rate uncertainty (quadrature sum)
    const trueCoincidenceRateUncertainty = Math.sqrt(
      Math.pow(coincidenceRateUncertainty, 2) +
        Math.pow(accidentalRateUncertainty, 2)
    );

    return {
      singlesA,
      singlesB,
      coincidences,
      duration,
      rateA,
      rateB,
      coincidenceRate,
      accidentalRate,
      trueCoincidenceRate,
      uncertainty: {
        singlesA: sigmaA,
        singlesB: sigmaB,
        coincidences: sigmaC,
        rateA: rateAUncertainty,
        rateB: rateBUncertainty,
        coincidenceRate: coincidenceRateUncertainty,
        accidentalRate: accidentalRateUncertainty,
        trueCoincidenceRate: trueCoincidenceRateUncertainty,
      },
    };
  }
}

export default CD48;
