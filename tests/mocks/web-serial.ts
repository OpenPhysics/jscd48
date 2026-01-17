import { vi, type Mock } from 'vitest';

/**
 * Mock Web Serial API for testing CD48 library
 *
 * This module provides a complete mock implementation of the Web Serial API
 * that can be used in unit and integration tests.
 */

interface MockSerialPortOptions {
  responses?: Record<string, string | (() => string)>;
  simulateDisconnect?: boolean;
  simulateNoDeviceSelected?: boolean;
  responseDelay?: number;
  hasPreviousPort?: boolean;
}

interface MockReader {
  read: Mock<() => Promise<{ value: string; done: boolean }>>;
  cancel: Mock<() => Promise<void>>;
  releaseLock: Mock<() => void>;
}

interface MockWriter {
  write: Mock<(data: string) => Promise<void>>;
  close: Mock<() => Promise<void>>;
  releaseLock: Mock<() => void>;
}

interface MockReadable {
  getReader: Mock<() => MockReader>;
  pipeTo: Mock<() => Promise<void>>;
}

interface MockWritable {
  getWriter: Mock<() => MockWriter>;
  pipeTo: Mock<() => Promise<void>>;
}

interface MockSerialPort {
  open: Mock<(options: { baudRate: number }) => Promise<void>>;
  close: Mock<() => Promise<void>>;
  readable: MockReadable;
  writable: MockWritable;
  getInfo: Mock<() => { usbVendorId: number; usbProductId: number }>;
  _getCommandQueue: () => string[];
  _clearCommandQueue: () => void;
  _setResponse: (command: string, response: string) => void;
  _queueResponse: (response: string) => void;
  _mockReader: MockReader;
  _mockWriter: MockWriter;
}

interface MockNavigatorSerial {
  requestPort: Mock<(filters?: SerialPortRequestOptions) => Promise<MockSerialPort>>;
  getPorts: Mock<() => Promise<MockSerialPort[]>>;
  addEventListener: Mock<() => void>;
  removeEventListener: Mock<() => void>;
  _mockPort: MockSerialPort;
}

interface SetupMockResult {
  mockSerial: MockNavigatorSerial;
  mockPort: MockSerialPort;
  mockReader: MockReader;
  mockWriter: MockWriter;
}

/**
 * Create a mock serial port with configurable behavior
 */
export function createMockSerialPort(options: MockSerialPortOptions = {}): MockSerialPort {
  const {
    responses = {
      'v\r': 'CD48 v1.0.0\r\n',
      'c\r': '0 0 0 0 0 0 0 0 0\r\n',
      'C\r':
        'Ch0: 0, Ch1: 0, Ch2: 0, Ch3: 0, Ch4: 0, Ch5: 0, Ch6: 0, Ch7: 0\r\n',
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
  let commandQueue: string[] = [];
  let responseQueue: string[] = [];

  // Mock reader
  const mockReader: MockReader = {
    read: vi.fn(async () => {
      if (simulateDisconnect) {
        return { value: '', done: true };
      }

      if (responseQueue.length > 0) {
        const value = responseQueue.shift()!;
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
  const mockWriter: MockWriter = {
    write: vi.fn(async (data: string) => {
      if (simulateDisconnect) {
        throw new Error('Device disconnected');
      }

      commandQueue.push(data);

      // Add response to queue based on command
      const responseValue = responses[data];
      const response = typeof responseValue === 'function' ? responseValue() : (responseValue ?? 'OK\r\n');
      responseQueue.push(response);
    }),
    close: vi.fn(async () => {
      isOpen = false;
    }),
    releaseLock: vi.fn(),
  };

  // Mock readable stream
  const mockReadable: MockReadable = {
    getReader: vi.fn(() => mockReader),
    pipeTo: vi.fn(async () => {
      // Simulate stream setup
      return Promise.resolve();
    }),
  };

  // Mock writable stream
  const mockWritable: MockWritable = {
    getWriter: vi.fn(() => mockWriter),
    pipeTo: vi.fn(async () => {
      // Simulate stream setup
      return Promise.resolve();
    }),
  };

  // Mock serial port
  const mockPort: MockSerialPort = {
    open: vi.fn(async () => {
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
    _setResponse: (command: string, response: string) => {
      (responses as Record<string, string>)[command] = response;
    },
    _queueResponse: (response: string) => {
      responseQueue.push(response);
    },
    _mockReader: mockReader,
    _mockWriter: mockWriter,
  };

  return mockPort;
}

/**
 * Create a mock navigator.serial object
 */
export function createMockNavigatorSerial(options: MockSerialPortOptions = {}): MockNavigatorSerial {
  const mockPort = createMockSerialPort(options);

  return {
    requestPort: vi.fn(async () => {
      if (options.simulateNoDeviceSelected) {
        const error = new Error('No port selected by the user');
        (error as Error & { name: string }).name = 'NotFoundError';
        throw error;
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

// Extend global types for the mock
declare global {
  // eslint-disable-next-line no-var
  var navigator: Navigator & { serial?: MockNavigatorSerial };
  // eslint-disable-next-line no-var
  var TextDecoderStream: typeof MockTextDecoderStream;
  // eslint-disable-next-line no-var
  var TextEncoderStream: typeof MockTextEncoderStream;
}

class MockTextDecoderStream {
  public writable: object;
  public readable: { getReader: () => MockReader };

  constructor(mockReader: MockReader) {
    this.writable = {};
    this.readable = {
      getReader: () => mockReader,
    };
  }
}

class MockTextEncoderStream {
  public readable: { pipeTo: Mock<() => Promise<void>> };
  public writable: { getWriter: () => MockWriter };

  constructor(mockWriter: MockWriter) {
    this.readable = {
      pipeTo: vi.fn(async () => Promise.resolve()),
    };
    this.writable = {
      getWriter: () => mockWriter,
    };
  }
}

/**
 * Setup global Web Serial API mocks
 * Call this in your test setup (beforeEach)
 */
export function setupWebSerialMock(options: MockSerialPortOptions = {}): SetupMockResult {
  const mockSerial = createMockNavigatorSerial(options);
  const mockPort = mockSerial._mockPort;

  // Setup global navigator
  global.navigator = {
    ...global.navigator,
    serial: mockSerial,
  } as Navigator & { serial: MockNavigatorSerial };

  // Setup TextDecoderStream
  global.TextDecoderStream = class extends MockTextDecoderStream {
    constructor() {
      super(mockPort._mockReader);
    }
  } as typeof MockTextDecoderStream;

  // Setup TextEncoderStream
  global.TextEncoderStream = class extends MockTextEncoderStream {
    constructor() {
      super(mockPort._mockWriter);
    }
  } as typeof MockTextEncoderStream;

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
export function cleanupWebSerialMock(): void {
  delete (global.navigator as Navigator & { serial?: MockNavigatorSerial }).serial;
  delete (global as { TextDecoderStream?: typeof MockTextDecoderStream }).TextDecoderStream;
  delete (global as { TextEncoderStream?: typeof MockTextEncoderStream }).TextEncoderStream;
}

/**
 * Create a mock port that simulates realistic CD48 responses
 */
export function createRealisticMockPort(): MockSerialPort {
  const counts = [100, 200, 150, 80, 25, 10, 5, 120];
  let overflow = 0;
  const triggerLevel = 128;
  const dacVoltage = 0;
  let impedance = 'highz';
  let repeatEnabled = false;
  const repeatInterval = 1000;

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
