/**
 * @fileoverview TypeScript definitions for validation utilities
 * @module validation
 */

/**
 * Valid channel range (0-7)
 */
export const CHANNEL_MIN: number;
export const CHANNEL_MAX: number;

/**
 * Valid voltage range (0-4.08V)
 */
export const VOLTAGE_MIN: number;
export const VOLTAGE_MAX: number;

/**
 * Valid byte range (0-255)
 */
export const BYTE_MIN: number;
export const BYTE_MAX: number;

/**
 * Valid repeat interval range (100-65535 ms)
 */
export const REPEAT_INTERVAL_MIN: number;
export const REPEAT_INTERVAL_MAX: number;

/**
 * Validate channel number
 */
export function validateChannel(channel: number): void;

/**
 * Validate voltage value
 */
export function validateVoltage(voltage: number): void;

/**
 * Validate byte value
 */
export function validateByte(byte: number): void;

/**
 * Validate repeat interval
 */
export function validateRepeatInterval(interval: number): void;

/**
 * Validate duration
 */
export function validateDuration(duration: number): void;

/**
 * Validate impedance mode
 */
export function validateImpedanceMode(mode: string): void;

/**
 * Validate boolean parameter
 */
export function validateBoolean(paramName: string, value: any): void;

/**
 * Clamp value to range
 */
export function clamp(value: number, min: number, max: number): number;

/**
 * Clamp voltage to valid range
 */
export function clampVoltage(voltage: number): number;

/**
 * Clamp repeat interval to valid range
 */
export function clampRepeatInterval(interval: number): number;

/**
 * Convert voltage to byte value (0-255)
 */
export function voltageToByte(voltage: number): number;

/**
 * Convert byte value to voltage
 */
export function byteToVoltage(byte: number): number;
