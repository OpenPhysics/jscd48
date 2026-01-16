import { bench, describe } from 'vitest';
import { MockSerial } from '../mocks/web-serial.js';

// Setup mock for benchmarks
global.navigator = {
  serial: new MockSerial(),
};

// Import after setting up global
const CD48Module = await import('../../cd48.js');
const CD48 = CD48Module.default;

describe('CD48 Performance Benchmarks', () => {
  describe('Instance Creation', () => {
    bench('create CD48 instance with defaults', () => {
      new CD48();
    });

    bench('create CD48 instance with custom options', () => {
      new CD48({ baudRate: 9600, commandDelay: 100 });
    });
  });

  describe('Voltage Calculations', () => {
    const cd48 = new CD48();

    bench('byteToVoltage conversion', () => {
      cd48.byteToVoltage(128);
    });

    bench('trigger level voltage clamping', () => {
      const voltage = Math.random() * 5;
      const clamped = Math.max(0, Math.min(4.08, voltage));
      const byte = Math.round((clamped / 4.08) * 255);
    });

    bench('DAC voltage clamping', () => {
      const voltage = Math.random() * 5;
      const clamped = Math.max(0, Math.min(4.08, voltage));
      const byte = Math.round((clamped / 4.08) * 255);
    });
  });

  describe('Count Parsing', () => {
    const cd48 = new CD48();

    bench('parse count response (8 channels)', () => {
      const response = '12345 23456 34567 45678 56789 67890 78901 8912';
      const counts = response.split(' ').map((c) => parseInt(c, 10));
    });

    bench('parse and validate count data', () => {
      const response = '12345 23456 34567 45678 56789 67890 78901 8912';
      const counts = response.split(' ').map((c) => {
        const num = parseInt(c, 10);
        return isNaN(num) ? 0 : num;
      });
    });
  });

  describe('Rate Calculations', () => {
    bench('calculate coincidence rate (basic)', () => {
      const na = 1000;
      const nb = 1500;
      const nab = 100;
      const t = 1.0;

      const ra = na / t;
      const rb = nb / t;
      const rab = nab / t;
      const racc = ra * rb * t;
      const rtrue = Math.max(0, rab - racc);
    });

    bench('calculate coincidence rate (full)', () => {
      const counts = {
        ch0: 1000,
        ch1: 1500,
        ch4: 100,
      };
      const duration = 1.0;

      const na = counts.ch0 / duration;
      const nb = counts.ch1 / duration;
      const nab = counts.ch4 / duration;
      const accidental = na * nb * duration;
      const true_coincidence = Math.max(0, nab - accidental);

      const result = {
        ra: na,
        rb: nb,
        rab: nab,
        accidental,
        true_coincidence,
      };
    });
  });

  describe('Command Formatting', () => {
    bench('format simple command', () => {
      const cmd = 'VER\r';
    });

    bench('format channel command', () => {
      const channel = 3;
      const cmd = `CH=${channel}\r`;
    });

    bench('format voltage command', () => {
      const byte = 128;
      const cmd = `THRS=${byte}\r`;
    });
  });

  describe('Data Validation', () => {
    bench('validate channel number (0-7)', () => {
      const channel = 5;
      if (channel < 0 || channel > 7) {
        throw new Error(`Invalid channel: ${channel}`);
      }
    });

    bench('validate voltage range (0-4.08V)', () => {
      const voltage = 2.5;
      if (voltage < 0 || voltage > 4.08) {
        throw new Error(`Invalid voltage: ${voltage}`);
      }
    });

    bench('validate count array length', () => {
      const counts = [100, 200, 300, 400, 500, 600, 700, 800];
      if (counts.length !== 8) {
        throw new Error('Expected 8 channel counts');
      }
    });
  });

  describe('String Operations', () => {
    bench('split space-separated values', () => {
      const str = '123 456 789 12 345 678 901 234';
      str.split(' ');
    });

    bench('trim and split', () => {
      const str = ' 123 456 789 12 345 678 901 234 ';
      str.trim().split(' ');
    });

    bench('join values with space', () => {
      const values = [123, 456, 789, 12, 345, 678, 901, 234];
      values.join(' ');
    });
  });

  describe('Array Operations', () => {
    bench('map array to integers', () => {
      const arr = ['123', '456', '789', '12', '345', '678', '901', '234'];
      arr.map((n) => parseInt(n, 10));
    });

    bench('filter and map array', () => {
      const arr = ['123', '456', '789', 'NaN', '345', '678', '901', '234'];
      arr.filter((n) => !isNaN(parseInt(n, 10))).map((n) => parseInt(n, 10));
    });

    bench('reduce array sum', () => {
      const arr = [123, 456, 789, 12, 345, 678, 901, 234];
      arr.reduce((sum, val) => sum + val, 0);
    });
  });

  describe('Object Operations', () => {
    bench('create count object', () => {
      const counts = {
        ch0: 123,
        ch1: 456,
        ch2: 789,
        ch3: 12,
        ch4: 345,
        ch5: 678,
        ch6: 901,
        ch7: 234,
      };
    });

    bench('destructure count object', () => {
      const counts = {
        ch0: 123,
        ch1: 456,
        ch2: 789,
        ch3: 12,
        ch4: 345,
        ch5: 678,
        ch6: 901,
        ch7: 234,
      };
      const { ch0, ch1, ch4 } = counts;
    });

    bench('spread and modify object', () => {
      const counts = {
        ch0: 123,
        ch1: 456,
        ch2: 789,
      };
      const updated = { ...counts, ch0: 999 };
    });
  });

  describe('Async Operations', () => {
    bench(
      'create and resolve promise',
      async () => {
        await Promise.resolve('test');
      },
      { time: 1000 }
    );

    bench(
      'promise with timeout',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      },
      { time: 1000 }
    );

    bench(
      'promise race',
      async () => {
        await Promise.race([
          Promise.resolve('fast'),
          new Promise((resolve) => setTimeout(() => resolve('slow'), 100)),
        ]);
      },
      { time: 1000 }
    );
  });
});
