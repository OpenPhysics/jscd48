import { vi } from 'vitest';

/**
 * Mock Web Serial API for testing CD48 library
 *
 * This module provides a complete mock implementation of the Web Serial API
 * that can be used in unit and integration tests.
 */

/**
 * Create a mock serial port with configurable behavior
 * @param {Object} options - Configuration options
 * @param {Object} options.responses - Map of commands to responses
 * @param {boolean} options.simulateDisconnect - Whether to simulate disconnection
 * @param {number} options.responseDelay - Delay in ms before responses
 */
export function createMockSerialPort(options = {}) {
  const {
    responses = {
      'v\r': 'CD48 v1.0.0\r\n',
      'c\r': '0 0 0 0 0 0 0 0 0\r\n',
      'C\r': 'Ch0: 0, Ch1: 0, Ch2: 0, Ch3: 0, Ch4: 0, Ch5: 0, Ch6: 0, Ch7: 0\r\n',
      'H\r': 'CD48 Help...\r\n',
      'p\r': '0 0 0 0 0 0 0 0 128 0\r\n',
      'P\r': 'Settings...\r\n',
      'E\r': '0\r\n',
      'T\r': 'OK\r\n',
    },
    simulateDisconnect = false,
    responseDelay = 0,
  } = options;

  let isOpen = false;
  let commandQueue = [];
  let responseQueue = [];

  // Mock reader
  const mockReader = {
    read: vi.fn(async () => {
      if (simulateDisconnect) {
        return { value: '', done: true };
      }

      if (responseQueue.length > 0) {
        const value = responseQueue.shift();
        if (responseDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, responseDelay));
        }
        return { value, done: false };
      }

      // Return empty value if no response
      return { value: '', done: false };
    }),
    cancel: vi.fn(async () => {
      isOpen = false;
    }),
    releaseLock: vi.fn(),
  };

  // Mock writer
  const mockWriter = {
    write: vi.fn(async (data) => {
      if (simulateDisconnect) {
        throw new Error('Device disconnected');
      }

      commandQueue.push(data);

      // Add response to queue based on command
      const response = responses[data] || 'OK\r\n';
      responseQueue.push(response);
    }),
    close: vi.fn(async () => {
      isOpen = false;
    }),
    releaseLock: vi.fn(),
  };

  // Mock readable stream
  const mockReadable = {
    getReader: vi.fn(() => mockReader),
    pipeTo: vi.fn(async () => {
      // Simulate stream setup
      return Promise.resolve();
    }),
  };

  // Mock writable stream
  const mockWritable = {
    getWriter: vi.fn(() => mockWriter),
    pipeTo: vi.fn(async () => {
      // Simulate stream setup
      return Promise.resolve();
    }),
  };

  // Mock serial port
  const mockPort = {
    open: vi.fn(async ({ baudRate }) => {
      if (isOpen) {
        throw new Error('Port already open');
      }
      isOpen = true;
      return Promise.resolve();
    }),
    close: vi.fn(async () => {
      isOpen = false;
      return Promise.resolve();
    }),
    readable: mockReadable,
    writable: mockWritable,
    getInfo: vi.fn(() => ({
      usbVendorId: 0x04b4,
      usbProductId: 0x0001,
    })),
    // Internal test helpers
    _getCommandQueue: () => commandQueue,
    _clearCommandQueue: () => {
      commandQueue = [];
    },
    _setResponse: (command, response) => {
      responses[command] = response;
    },
    _queueResponse: (response) => {
      responseQueue.push(response);
    },
    _mockReader: mockReader,
    _mockWriter: mockWriter,
  };

  return mockPort;
}

/**
 * Create a mock navigator.serial object
 * @param {Object} options - Configuration options
 */
export function createMockNavigatorSerial(options = {}) {
  const mockPort = createMockSerialPort(options);

  return {
    requestPort: vi.fn(async (filters) => {
      if (options.simulateNoDeviceSelected) {
        throw new Error('No port selected by the user');
      }
      return mockPort;
    }),
    getPorts: vi.fn(async () => {
      if (options.hasPreviousPort) {
        return [mockPort];
      }
      return [];
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    _mockPort: mockPort,
  };
}

/**
 * Setup global Web Serial API mocks
 * Call this in your test setup (beforeEach)
 * @param {Object} options - Configuration options
 * @returns {Object} Mock objects for inspection
 */
export function setupWebSerialMock(options = {}) {
  const mockSerial = createMockNavigatorSerial(options);
  const mockPort = mockSerial._mockPort;

  // Setup global navigator
  global.navigator = {
    ...global.navigator,
    serial: mockSerial,
  };

  // Setup TextDecoderStream
  global.TextDecoderStream = class MockTextDecoderStream {
    constructor() {
      this.writable = {};
      this.readable = {
        getReader: () => mockPort._mockReader,
      };
    }
  };

  // Setup TextEncoderStream
  global.TextEncoderStream = class MockTextEncoderStream {
    constructor() {
      this.readable = {
        pipeTo: vi.fn(async () => Promise.resolve()),
      };
      this.writable = {
        getWriter: () => mockPort._mockWriter,
      };
    }
  };

  return {
    mockSerial,
    mockPort,
    mockReader: mockPort._mockReader,
    mockWriter: mockPort._mockWriter,
  };
}

/**
 * Cleanup Web Serial API mocks
 * Call this in your test teardown (afterEach)
 */
export function cleanupWebSerialMock() {
  delete global.navigator.serial;
  delete global.TextDecoderStream;
  delete global.TextEncoderStream;
}

/**
 * Create a mock port that simulates realistic CD48 responses
 */
export function createRealisticMockPort() {
  let counts = [100, 200, 150, 80, 25, 10, 5, 120];
  let overflow = 0;
  let triggerLevel = 128;
  let dacVoltage = 0;
  let impedance = 'highz';
  let repeatInterval = 1000;
  let repeatEnabled = false;

  return createMockSerialPort({
    responses: {
      'v\r': 'CD48 Firmware v2.1.3\r\n',
      'c\r': () => `${counts.join(' ')} ${overflow}\r\n`,
      'C\r': () =>
        `Ch0:${counts[0]} Ch1:${counts[1]} Ch2:${counts[2]} Ch3:${counts[3]} Ch4:${counts[4]} Ch5:${counts[5]} Ch6:${counts[6]} Ch7:${counts[7]}\r\n`,
      'H\r':
        'CD48 Coincidence Counter\nCommands: v,H,c,C,p,P,S,L,z,Z,r,R,V,E,T\r\n',
      'p\r': () => `0 0 0 0 0 0 0 0 ${triggerLevel} ${dacVoltage}\r\n`,
      'P\r': () =>
        `Trigger: ${triggerLevel}, DAC: ${dacVoltage}, Impedance: ${impedance}, Repeat: ${repeatEnabled ? repeatInterval : 'off'}\r\n`,
      'E\r': () => {
        const result = overflow;
        overflow = 0;
        return `${result}\r\n`;
      },
      'T\r': 'Testing LEDs...\r\n',
      'z\r': () => {
        impedance = '50ohm';
        return 'OK\r\n';
      },
      'Z\r': () => {
        impedance = 'highz';
        return 'OK\r\n';
      },
      'R\r': () => {
        repeatEnabled = !repeatEnabled;
        return 'OK\r\n';
      },
    },
  });
}

export default {
  createMockSerialPort,
  createMockNavigatorSerial,
  setupWebSerialMock,
  cleanupWebSerialMock,
  createRealisticMockPort,
};
