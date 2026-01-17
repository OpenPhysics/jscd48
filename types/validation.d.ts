/**
 * Type definitions for CD48 validation utilities
 */

/** Valid channel range minimum (0) */
export const CHANNEL_MIN: number;
/** Valid channel range maximum (7) */
export const CHANNEL_MAX: number;

/** Valid voltage range minimum (0.0V) */
export const VOLTAGE_MIN: number;
/** Valid voltage range maximum (4.08V) */
export const VOLTAGE_MAX: number;

/** Valid byte range minimum (0) */
export const BYTE_MIN: number;
/** Valid byte range maximum (255) */
export const BYTE_MAX: number;

/** Valid repeat interval range minimum (100ms) */
export const REPEAT_INTERVAL_MIN: number;
/** Valid repeat interval range maximum (65535ms) */
export const REPEAT_INTERVAL_MAX: number;

/**
 * Validate channel number
 * @throws {InvalidChannelError} If channel is out of range
 */
export function validateChannel(channel: number): void;

/**
 * Validate voltage value
 * @throws {InvalidVoltageError} If voltage is out of range
 */
export function validateVoltage(voltage: number): void;

/**
 * Validate byte value
 * @throws {ValidationError} If byte is out of range
 */
export function validateByte(byte: number): void;

/**
 * Validate repeat interval
 * @throws {ValidationError} If interval is out of range
 */
export function validateRepeatInterval(interval: number): void;

/**
 * Validate duration
 * @throws {ValidationError} If duration is invalid
 */
export function validateDuration(duration: number): void;

/**
 * Validate impedance mode
 * @throws {ValidationError} If mode is invalid
 */
export function validateImpedanceMode(mode: string): void;

/**
 * Validate boolean parameter
 * @throws {ValidationError} If value is not boolean
 */
export function validateBoolean(paramName: string, value: unknown): void;

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
