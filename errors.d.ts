/**
 * @fileoverview TypeScript definitions for custom error classes
 * @module errors
 */

/**
 * Base error class for CD48-related errors
 */
export class CD48Error extends Error {
  name: string;
  constructor(message: string);
}

/**
 * Error thrown when Web Serial API is not supported
 */
export class UnsupportedBrowserError extends CD48Error {
  constructor();
}

/**
 * Error thrown when device is not connected
 */
export class NotConnectedError extends CD48Error {
  operation: string;
  constructor(operation: string);
}

/**
 * Error thrown when connection fails
 */
export class ConnectionError extends CD48Error {
  cause?: any;
  constructor(message: string, cause?: any);
}

/**
 * Error thrown when user cancels device selection
 */
export class DeviceSelectionCancelledError extends CD48Error {
  constructor();
}

/**
 * Error thrown when command times out
 */
export class CommandTimeoutError extends CD48Error {
  command: string;
  timeout: number;
  constructor(command: string, timeout: number);
}

/**
 * Error thrown when response format is invalid
 */
export class InvalidResponseError extends CD48Error {
  response: string;
  expected: string;
  constructor(response: string, expected: string);
}

/**
 * Error thrown when parameter validation fails
 */
export class ValidationError extends CD48Error {
  parameter: string;
  value: any;
  constraints: string;
  constructor(parameter: string, value: any, constraints: string);
}

/**
 * Error thrown when channel number is out of range
 */
export class InvalidChannelError extends ValidationError {
  constructor(channel: number);
}

/**
 * Error thrown when voltage is out of range
 */
export class InvalidVoltageError extends ValidationError {
  constructor(voltage: number);
}

/**
 * Error thrown when communication with device fails
 */
export class CommunicationError extends CD48Error {
  cause?: any;
  constructor(message: string, cause?: any);
}
