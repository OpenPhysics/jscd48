/**
 * Validation utilities for CD48 parameters
 */

import {
  InvalidChannelError,
  InvalidVoltageError,
  ValidationError,
} from './errors.js';

/**
 * Valid channel range (0-7)
 */
export const CHANNEL_MIN = 0;
export const CHANNEL_MAX = 7;

/**
 * Valid voltage range (0-4.08V)
 */
export const VOLTAGE_MIN = 0.0;
export const VOLTAGE_MAX = 4.08;

/**
 * Valid byte range (0-255)
 */
export const BYTE_MIN = 0;
export const BYTE_MAX = 255;

/**
 * Valid repeat interval range (100-65535 ms)
 */
export const REPEAT_INTERVAL_MIN = 100;
export const REPEAT_INTERVAL_MAX = 65535;

/**
 * Impedance mode type
 */
export type ImpedanceMode = 'highz' | '50ohm';

/**
 * Validate channel number
 * @param channel - Channel number to validate
 * @throws InvalidChannelError If channel is out of range
 */
export function validateChannel(channel: number): void {
  if (typeof channel !== 'number' || isNaN(channel)) {
    throw new ValidationError(
      'channel',
      channel,
      'must be a number between 0 and 7'
    );
  }

  if (channel < CHANNEL_MIN || channel > CHANNEL_MAX) {
    throw new InvalidChannelError(channel);
  }
}

/**
 * Validate voltage value
 * @param voltage - Voltage to validate
 * @throws InvalidVoltageError If voltage is out of range
 */
export function validateVoltage(voltage: number): void {
  if (typeof voltage !== 'number' || isNaN(voltage)) {
    throw new ValidationError(
      'voltage',
      voltage,
      'must be a number between 0.0 and 4.08'
    );
  }

  if (voltage < VOLTAGE_MIN || voltage > VOLTAGE_MAX) {
    throw new InvalidVoltageError(voltage);
  }
}

/**
 * Validate byte value
 * @param byte - Byte value to validate
 * @throws ValidationError If byte is out of range
 */
export function validateByte(byte: number): void {
  if (typeof byte !== 'number' || isNaN(byte)) {
    throw new ValidationError(
      'byte',
      byte,
      'must be a number between 0 and 255'
    );
  }

  if (byte < BYTE_MIN || byte > BYTE_MAX) {
    throw new ValidationError('byte', byte, '0-255');
  }
}

/**
 * Validate repeat interval
 * @param interval - Interval in milliseconds
 * @throws ValidationError If interval is out of range
 */
export function validateRepeatInterval(interval: number): void {
  if (typeof interval !== 'number' || isNaN(interval)) {
    throw new ValidationError(
      'repeat_interval',
      interval,
      'must be a number between 100 and 65535'
    );
  }

  if (interval < REPEAT_INTERVAL_MIN || interval > REPEAT_INTERVAL_MAX) {
    throw new ValidationError('repeat_interval', interval, '100-65535 ms');
  }
}

/**
 * Validate duration
 * @param duration - Duration in seconds
 * @throws ValidationError If duration is invalid
 */
export function validateDuration(duration: number): void {
  if (typeof duration !== 'number' || isNaN(duration)) {
    throw new ValidationError(
      'duration',
      duration,
      'must be a positive number'
    );
  }

  if (duration <= 0) {
    throw new ValidationError('duration', duration, 'must be greater than 0');
  }
}

/**
 * Validate impedance mode
 * @param mode - Impedance mode ('highz' or '50ohm')
 * @throws ValidationError If mode is invalid
 */
export function validateImpedanceMode(
  mode: string
): asserts mode is ImpedanceMode {
  const validModes: ImpedanceMode[] = ['highz', '50ohm'];

  if (typeof mode !== 'string') {
    throw new ValidationError('impedance', mode, "must be 'highz' or '50ohm'");
  }

  if (!validModes.includes(mode.toLowerCase() as ImpedanceMode)) {
    throw new ValidationError('impedance', mode, "must be 'highz' or '50ohm'");
  }
}

/**
 * Validate boolean parameter
 * @param paramName - Parameter name
 * @param value - Value to validate
 * @throws ValidationError If value is not boolean
 */
export function validateBoolean(
  paramName: string,
  value: unknown
): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(paramName, value, 'must be true or false');
  }
}

/**
 * Clamp value to range
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp voltage to valid range
 * @param voltage - Voltage to clamp
 * @returns Clamped voltage
 */
export function clampVoltage(voltage: number): number {
  return clamp(voltage, VOLTAGE_MIN, VOLTAGE_MAX);
}

/**
 * Clamp repeat interval to valid range
 * @param interval - Interval to clamp
 * @returns Clamped interval
 */
export function clampRepeatInterval(interval: number): number {
  return clamp(interval, REPEAT_INTERVAL_MIN, REPEAT_INTERVAL_MAX);
}

/**
 * Convert voltage to byte value (0-255)
 * @param voltage - Voltage (0-4.08V)
 * @returns Byte value (0-255)
 */
export function voltageToByte(voltage: number): number {
  const clamped = clampVoltage(voltage);
  return Math.round((clamped / VOLTAGE_MAX) * BYTE_MAX);
}

/**
 * Convert byte value to voltage
 * @param byte - Byte value (0-255)
 * @returns Voltage (0-4.08V)
 */
export function byteToVoltage(byte: number): number {
  validateByte(byte);
  return (byte / BYTE_MAX) * VOLTAGE_MAX;
}
