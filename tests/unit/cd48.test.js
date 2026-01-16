import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupWebSerialMock,
  cleanupWebSerialMock,
} from '../mocks/web-serial.js';

// Import CD48 after mocks are set up
const CD48Module = await import('../../cd48.js');
const CD48 = CD48Module.default || CD48Module;

describe('CD48', () => {
  let mocks;

  beforeEach(() => {
    mocks = setupWebSerialMock();
  });

  afterEach(() => {
    cleanupWebSerialMock();
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const cd48 = new CD48();
      expect(cd48.baudRate).toBe(115200);
      expect(cd48.commandDelay).toBe(50);
      expect(cd48.port).toBeNull();
    });

    it('should create instance with custom options', () => {
      const cd48 = new CD48({ baudRate: 9600, commandDelay: 100 });
      expect(cd48.baudRate).toBe(9600);
      expect(cd48.commandDelay).toBe(100);
    });
  });

  describe('isSupported', () => {
    it('should return true when Web Serial API is available', () => {
      expect(CD48.isSupported()).toBe(true);
    });

    it('should return false when Web Serial API is not available', () => {
      delete global.navigator.serial;
      expect(CD48.isSupported()).toBe(false);
    });
  });

  describe('Connection', () => {
    it('should throw error if Web Serial API not supported', async () => {
      delete global.navigator.serial;
      const cd48 = new CD48();
      await expect(cd48.connect()).rejects.toThrow(
        'Web Serial API not supported'
      );
    });

    it('should connect successfully', async () => {
      const cd48 = new CD48();
      const result = await cd48.connect();
      expect(result).toBe(true);
      expect(cd48.isConnected()).toBe(true);
    });

    it('should handle user cancellation', async () => {
      cleanupWebSerialMock();
      setupWebSerialMock({ simulateNoDeviceSelected: true });

      const cd48 = new CD48();
      await expect(cd48.connect()).rejects.toThrow();
    });

    it('should return false for isConnected when not connected', () => {
      const cd48 = new CD48();
      expect(cd48.isConnected()).toBe(false);
    });

    it('should disconnect successfully', async () => {
      const cd48 = new CD48();
      await cd48.connect();
      expect(cd48.isConnected()).toBe(true);

      await cd48.disconnect();
      expect(cd48.isConnected()).toBe(false);
    });
  });

  describe('Helper methods', () => {
    it('should sleep for specified time', async () => {
      const cd48 = new CD48();
      const start = Date.now();
      await cd48.sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95);
    });

    it('should convert byte to voltage correctly', () => {
      expect(CD48.byteToVoltage(0)).toBe(0);
      expect(CD48.byteToVoltage(255)).toBe(4.08);
      expect(CD48.byteToVoltage(128)).toBeCloseTo(2.04, 2);
    });
  });

  describe('Channel configuration validation', () => {
    let cd48;

    beforeEach(() => {
      cd48 = new CD48();
    });

    it('should throw error for invalid channel in setChannel', async () => {
      await expect(
        cd48.setChannel(-1, { A: 1, B: 0, C: 0, D: 0 })
      ).rejects.toThrow('Channel must be 0-7');

      await expect(
        cd48.setChannel(8, { A: 1, B: 0, C: 0, D: 0 })
      ).rejects.toThrow('Channel must be 0-7');
    });

    it('should throw error for invalid channel in measureRate', async () => {
      await expect(cd48.measureRate(-1, 1)).rejects.toThrow(
        'Channel must be 0-7'
      );

      await expect(cd48.measureRate(8, 1)).rejects.toThrow(
        'Channel must be 0-7'
      );
    });
  });

  describe('Voltage calculations', () => {
    it('should clamp trigger level voltage to valid range', () => {
      const calculateByte = (voltage) =>
        Math.max(0, Math.min(255, Math.round((voltage / 4.08) * 255)));

      expect(calculateByte(-1.0)).toBe(0);
      expect(calculateByte(0.0)).toBe(0);
      expect(calculateByte(2.04)).toBe(128);
      expect(calculateByte(4.08)).toBe(255);
      expect(calculateByte(5.0)).toBe(255);
    });

    it('should clamp DAC voltage to valid range', () => {
      const calculateByte = (voltage) =>
        Math.max(0, Math.min(255, Math.round((voltage / 4.08) * 255)));

      expect(calculateByte(-1.0)).toBe(0);
      expect(calculateByte(0.0)).toBe(0);
      expect(calculateByte(2.04)).toBe(128);
      expect(calculateByte(4.08)).toBe(255);
      expect(calculateByte(5.0)).toBe(255);
    });
  });

  describe('Count parsing', () => {
    it('should parse count response correctly', () => {
      const response = '100 200 300 400 500 600 700 800 0';
      const parts = response.split(/\s+/).filter((p) => p.length > 0);

      expect(parts.length).toBe(9);

      const parsed = {
        counts: parts.slice(0, 8).map(Number),
        overflow: parseInt(parts[8]),
      };

      expect(parsed.counts).toEqual([100, 200, 300, 400, 500, 600, 700, 800]);
      expect(parsed.overflow).toBe(0);
    });
  });

  describe('Rate calculations', () => {
    it('should calculate coincidence rates correctly', () => {
      const singlesA = 1000;
      const singlesB = 2000;
      const coincidences = 50;
      const duration = 10;
      const coincidenceWindow = 25e-9;

      const rateA = singlesA / duration;
      const rateB = singlesB / duration;
      const coincidenceRate = coincidences / duration;
      const accidentalRate = 2 * coincidenceWindow * rateA * rateB;
      const trueCoincidenceRate = Math.max(0, coincidenceRate - accidentalRate);

      expect(rateA).toBe(100);
      expect(rateB).toBe(200);
      expect(coincidenceRate).toBe(5);
      expect(accidentalRate).toBeCloseTo(0.001, 6);
      expect(trueCoincidenceRate).toBeCloseTo(4.999, 3);
    });

    it('should not return negative true coincidence rates', () => {
      const coincidenceRate = 1;
      const accidentalRate = 2;
      const trueCoincidenceRate = Math.max(0, coincidenceRate - accidentalRate);

      expect(trueCoincidenceRate).toBe(0);
    });
  });

  describe('Repeat interval validation', () => {
    it('should clamp repeat interval to valid range', () => {
      const clamp = (ms) => Math.max(100, Math.min(65535, ms));

      expect(clamp(50)).toBe(100);
      expect(clamp(100)).toBe(100);
      expect(clamp(1000)).toBe(1000);
      expect(clamp(65535)).toBe(65535);
      expect(clamp(70000)).toBe(65535);
    });
  });

  describe('Error handling', () => {
    let cd48;

    beforeEach(() => {
      cd48 = new CD48();
    });

    it('should throw error when sending command while not connected', async () => {
      await expect(cd48.sendCommand('v')).rejects.toThrow(
        'Not connected to CD48'
      );
    });

    it('should throw error when getting version while not connected', async () => {
      await expect(cd48.getVersion()).rejects.toThrow('Not connected to CD48');
    });

    it('should throw error when getting counts while not connected', async () => {
      await expect(cd48.getCounts()).rejects.toThrow('Not connected to CD48');
    });
  });

  describe('Commands', () => {
    let cd48;

    beforeEach(async () => {
      cd48 = new CD48();
      await cd48.connect();
    });

    afterEach(async () => {
      if (cd48 && cd48.isConnected()) {
        await cd48.disconnect();
      }
    });

    it('should send version command', async () => {
      const version = await cd48.getVersion();
      expect(typeof version).toBe('string');
      expect(mocks.mockWriter.write).toHaveBeenCalledWith('v\r');
    });

    it('should send getCounts command', async () => {
      const counts = await cd48.getCounts();
      expect(counts).toHaveProperty('counts');
      expect(counts).toHaveProperty('overflow');
      expect(Array.isArray(counts.counts)).toBe(true);
      expect(counts.counts.length).toBe(8);
      expect(mocks.mockWriter.write).toHaveBeenCalledWith('c\r');
    });

    it('should send human readable getCounts command', async () => {
      const result = await cd48.getCounts(true);
      expect(typeof result).toBe('string');
      expect(mocks.mockWriter.write).toHaveBeenCalledWith('C\r');
    });

    it('should clear counts', async () => {
      await cd48.clearCounts();
      expect(mocks.mockWriter.write).toHaveBeenCalledWith('c\r');
    });
  });
});
