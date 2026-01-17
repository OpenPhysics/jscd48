import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockCD48 } from '../mock-cd48.js';

describe('CD48 Integration Tests - Mock Hardware', () => {
  let cd48;

  beforeEach(() => {
    cd48 = new MockCD48();
  });

  afterEach(async () => {
    if (cd48.isConnected()) {
      await cd48.disconnect();
    }
  });

  describe('Connection Lifecycle', () => {
    it('should connect successfully', async () => {
      await cd48.connect();
      expect(cd48.isConnected()).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await cd48.connect();
      await cd48.disconnect();
      expect(cd48.isConnected()).toBe(false);
    });

    it('should handle rapid connect/disconnect cycles', async () => {
      for (let i = 0; i < 10; i++) {
        await cd48.connect();
        expect(cd48.isConnected()).toBe(true);
        await cd48.disconnect();
        expect(cd48.isConnected()).toBe(false);
      }
    });

    it('should throw error when connecting to failed device', async () => {
      cd48.failConnection = true;
      await expect(cd48.connect()).rejects.toThrow('Mock connection failed');
    });

    it('should throw error when sending command while disconnected', async () => {
      await expect(cd48.getVersion()).rejects.toThrow('Device not connected');
    });
  });

  describe('Data Acquisition', () => {
    beforeEach(async () => {
      await cd48.connect();
    });

    it('should get firmware version', async () => {
      const version = await cd48.getVersion();
      expect(version).toBe('Mock v1.0.0');
    });

    it('should get counts for all channels', async () => {
      const data = await cd48.getCounts();
      expect(data.counts).toHaveLength(8);
      expect(data.counts.every((c) => typeof c === 'number')).toBe(true);
    });

    it('should clear counts', async () => {
      cd48.setCounts([10, 20, 30, 40, 50, 60, 70, 80]);
      await cd48.clearCounts();
      const data = await cd48.getCounts();
      expect(data.counts.every((c) => c === 0)).toBe(true);
    });

    it('should auto-increment counts over time', async () => {
      cd48.autoIncrement = true;
      cd48._startAutoIncrement();

      const before = await cd48.getCounts();
      await cd48.sleep(200);
      const after = await cd48.getCounts();

      // At least some channels should have increased
      const increased = before.counts.some((count, i) => after.counts[i] > count);
      expect(increased).toBe(true);
    });
  });

  describe('Rate Measurements', () => {
    beforeEach(async () => {
      await cd48.connect();
    });

    it('should measure channel rate', async () => {
      const result = await cd48.measureRate(0, 0.5);
      expect(result.channel).toBe(0);
      expect(result.duration).toBe(0.5);
      expect(result.rate).toBeGreaterThanOrEqual(0);
      expect(result.uncertainty).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for invalid channel', async () => {
      await expect(cd48.measureRate(10, 1.0)).rejects.toThrow('Invalid channel');
    });

    it('should measure coincidence rate', async () => {
      const result = await cd48.measureCoincidenceRate({ duration: 0.5 });
      expect(result.duration).toBe(0.5);
      expect(result.rate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await cd48.connect();
    });

    it('should handle command failure', async () => {
      cd48.failNextCommand();
      await expect(cd48.getVersion()).rejects.toThrow('Mock command failed');
    });

    it('should handle unexpected disconnect', async () => {
      cd48.setDisconnectAfter(2);
      await cd48.getVersion(); // 1st command
      await cd48.getCounts(); // 2nd command
      await expect(cd48.getSettings()).rejects.toThrow(
        'Device disconnected unexpectedly'
      );
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      await cd48.connect();
    });

    it('should handle multiple simultaneous reads', async () => {
      const promises = [
        cd48.getCounts(),
        cd48.getVersion(),
        cd48.getSettings(),
        cd48.getCounts(),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(4);
      expect(results[0].counts).toHaveLength(8);
      expect(typeof results[1]).toBe('string');
    });

    it('should handle rapid sequential commands', async () => {
      for (let i = 0; i < 20; i++) {
        const data = await cd48.getCounts();
        expect(data.counts).toHaveLength(8);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should report as supported even without hardware', () => {
      expect(MockCD48.isSupported()).toBe(true);
    });

    it('should handle setting custom count values', () => {
      const customCounts = [100, 200, 300, 400, 500, 600, 700, 800];
      cd48.setCounts(customCounts);
      expect(cd48.counts).toEqual(customCounts);
    });

    it('should throw error when setting invalid count array', () => {
      expect(() => cd48.setCounts([1, 2, 3])).toThrow(
        'Must provide 8 count values'
      );
    });

    it('should handle zero duration measurements', async () => {
      await cd48.connect();
      const result = await cd48.measureRate(0, 0.001);
      expect(result.duration).toBe(0.001);
    });
  });

  describe('Long-running Operations', () => {
    beforeEach(async () => {
      await cd48.connect();
    });

    it('should maintain connection during long measurement', async () => {
      const result = await cd48.measureRate(0, 1.0);
      expect(cd48.isConnected()).toBe(true);
      expect(result.duration).toBe(1.0);
    });

    it('should handle multiple long measurements', async () => {
      const results = await Promise.all([
        cd48.measureRate(0, 0.5),
        cd48.measureRate(1, 0.5),
        cd48.measureRate(2, 0.5),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result.channel).toBe(i);
      });
    });
  });

  describe('Data Consistency', () => {
    beforeEach(async () => {
      await cd48.connect();
    });

    it('should return consistent data structure', async () => {
      const data1 = await cd48.getCounts();
      const data2 = await cd48.getCounts();

      expect(data1).toHaveProperty('counts');
      expect(data1).toHaveProperty('coincidenceCounts');
      expect(data1).toHaveProperty('timestamp');

      expect(data2).toHaveProperty('counts');
      expect(data2).toHaveProperty('coincidenceCounts');
      expect(data2).toHaveProperty('timestamp');
    });

    it('should increment timestamp with each read', async () => {
      const data1 = await cd48.getCounts();
      await cd48.sleep(10);
      const data2 = await cd48.getCounts();

      expect(data2.timestamp).toBeGreaterThan(data1.timestamp);
    });
  });
});
