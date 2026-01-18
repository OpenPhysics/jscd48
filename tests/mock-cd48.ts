/**
 * Mock CD48 device for testing
 * Simulates the behavior of a real CD48 without hardware
 */

interface MockCD48Options {
  initialCounts?: number[];
  initialCoincidenceCounts?: number;
  version?: string;
  autoIncrement?: boolean;
  incrementRate?: number;
  commandDelay?: number;
  failConnection?: boolean;
  failCommands?: boolean;
  disconnectAfter?: number | null;
}

interface CountData {
  counts: number[];
  coincidenceCounts: number;
  timestamp: number;
}

interface SettingsData {
  baud: number;
  timeout: number;
  commandDelay: number;
  firmware: string;
}

interface RateMeasurement {
  channel: number;
  duration: number;
  counts: number;
  rate: number;
  uncertainty: number;
}

interface CoincidenceRateMeasurement {
  duration: number;
  counts: number;
  rate: number;
  uncertainty: number;
}

interface CoincidenceMeasurementOptions {
  duration?: number;
}

export class MockCD48 {
  public connected: boolean;
  public counts: number[];
  public coincidenceCounts: number;
  public version: string;
  public autoIncrement: boolean;
  public incrementRate: number;
  public commandDelay: number;
  public failConnection: boolean;
  public failCommands: boolean;
  public disconnectAfter: number | null;
  public commandCount: number;
  private _autoIncrementInterval: ReturnType<typeof setInterval> | null;

  constructor(options: MockCD48Options = {}) {
    this.connected = false;
    this.counts = options.initialCounts ?? [0, 0, 0, 0, 0, 0, 0, 0];
    this.coincidenceCounts = options.initialCoincidenceCounts ?? 0;
    this.version = options.version ?? 'Mock v1.0.0';
    this.autoIncrement = options.autoIncrement !== false;
    this.incrementRate = options.incrementRate ?? 10; // counts per second
    this.commandDelay = options.commandDelay ?? 10; // ms
    this.failConnection = options.failConnection ?? false;
    this.failCommands = options.failCommands ?? false;
    this.disconnectAfter = options.disconnectAfter ?? null; // commands before disconnect
    this.commandCount = 0;
    this._autoIncrementInterval = null;
  }

  /**
   * Check if Web Serial API is supported
   */
  static isSupported(): boolean {
    return true; // Mock always reports as supported
  }

  /**
   * Simulate connection to device
   */
  async connect(): Promise<boolean> {
    await this._delay(this.commandDelay);

    if (this.failConnection) {
      throw new Error('Mock connection failed');
    }

    this.connected = true;
    this.commandCount = 0;

    // Start auto-incrementing counts if enabled
    if (this.autoIncrement) {
      this._startAutoIncrement();
    }

    return true;
  }

  /**
   * Simulate disconnection
   */
  async disconnect(): Promise<boolean> {
    await this._delay(this.commandDelay);
    this.connected = false;
    this._stopAutoIncrement();
    return true;
  }

  /**
   * Check if device is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get firmware version
   */
  async getVersion(): Promise<string> {
    await this._executeCommand();
    return this.version;
  }

  /**
   * Get current counts for all channels
   */
  async getCounts(): Promise<CountData> {
    await this._executeCommand();
    return {
      counts: [...this.counts], // Return copy
      coincidenceCounts: this.coincidenceCounts,
      timestamp: Date.now(),
    };
  }

  /**
   * Get device settings
   */
  async getSettings(): Promise<SettingsData> {
    await this._executeCommand();
    return {
      baud: 9600,
      timeout: 1000,
      commandDelay: 50,
      firmware: this.version,
    };
  }

  /**
   * Clear all counters
   */
  async clearCounts(): Promise<boolean> {
    await this._executeCommand();
    this.counts = [0, 0, 0, 0, 0, 0, 0, 0];
    this.coincidenceCounts = 0;
    return true;
  }

  /**
   * Measure count rate for a channel
   */
  async measureRate(
    channel: number,
    duration: number
  ): Promise<RateMeasurement> {
    await this._executeCommand();

    if (channel < 0 || channel > 7) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    const startCounts = this.counts[channel] ?? 0;
    await this._delay(duration * 1000);
    const endCounts = this.counts[channel] ?? 0;

    const totalCounts = endCounts - startCounts;
    const rate = totalCounts / duration;

    return {
      channel,
      duration,
      counts: totalCounts,
      rate,
      uncertainty: Math.sqrt(Math.max(0, totalCounts)) / duration,
    };
  }

  /**
   * Measure coincidence rate
   */
  async measureCoincidenceRate(
    options: CoincidenceMeasurementOptions = {}
  ): Promise<CoincidenceRateMeasurement> {
    await this._executeCommand();

    const duration = options.duration ?? 1.0;
    const startCounts = this.coincidenceCounts;

    await this._delay(duration * 1000);

    const endCounts = this.coincidenceCounts;
    const totalCounts = endCounts - startCounts;
    const rate = totalCounts / duration;

    return {
      duration,
      counts: totalCounts,
      rate,
      uncertainty: Math.sqrt(Math.max(0, totalCounts)) / duration,
    };
  }

  /**
   * Set repeat mode (auto-update)
   */
  async setRepeat(_intervalMs: number): Promise<boolean> {
    await this._executeCommand();
    // Mock implementation - not actually used
    return true;
  }

  /**
   * Toggle repeat mode
   */
  async toggleRepeat(): Promise<boolean> {
    await this._executeCommand();
    // Mock implementation
    return true;
  }

  /**
   * Sleep utility
   */
  async sleep(ms: number): Promise<void> {
    await this._delay(ms);
  }

  /**
   * Set count values (for testing)
   */
  setCounts(counts: number[]): void {
    if (counts.length !== 8) {
      throw new Error('Must provide 8 count values');
    }
    this.counts = [...counts];
  }

  /**
   * Set coincidence counts (for testing)
   */
  setCoincidenceCounts(count: number): void {
    this.coincidenceCounts = count;
  }

  /**
   * Simulate error on next command (for testing)
   */
  failNextCommand(): void {
    this.failCommands = true;
    setTimeout(() => {
      this.failCommands = false;
    }, 100);
  }

  /**
   * Simulate disconnect after N commands (for testing)
   */
  setDisconnectAfter(n: number): void {
    this.disconnectAfter = n;
    this.commandCount = 0;
  }

  // Private methods

  private async _executeCommand(): Promise<void> {
    if (!this.connected) {
      throw new Error('Device not connected');
    }

    await this._delay(this.commandDelay);

    if (this.failCommands) {
      throw new Error('Mock command failed');
    }

    this.commandCount++;

    if (
      this.disconnectAfter !== null &&
      this.commandCount > this.disconnectAfter
    ) {
      this.connected = false;
      throw new Error('Device disconnected unexpectedly');
    }
  }

  private async _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _startAutoIncrement(): void {
    this._stopAutoIncrement();
    this._autoIncrementInterval = setInterval(() => {
      if (!this.connected) {
        this._stopAutoIncrement();
        return;
      }

      // Increment each channel with some randomness
      for (let i = 0; i < 8; i++) {
        const increment = Math.floor(
          Math.random() * this.incrementRate * 2 * (100 / 1000)
        );
        this.counts[i] = (this.counts[i] ?? 0) + increment;
      }

      // Increment coincidence counts (less frequent)
      this.coincidenceCounts += Math.floor(
        Math.random() * this.incrementRate * 0.1
      );
    }, 100);
  }

  private _stopAutoIncrement(): void {
    if (this._autoIncrementInterval) {
      clearInterval(this._autoIncrementInterval);
      this._autoIncrementInterval = null;
    }
  }
}

export default MockCD48;
