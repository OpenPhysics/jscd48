import { describe, it, expect } from 'vitest';
import {
  CHANNEL_MIN,
  CHANNEL_MAX,
  VOLTAGE_MIN,
  VOLTAGE_MAX,
  BYTE_MIN,
  BYTE_MAX,
  REPEAT_INTERVAL_MIN,
  REPEAT_INTERVAL_MAX,
  validateChannel,
  validateVoltage,
  validateByte,
  validateRepeatInterval,
  validateDuration,
  validateImpedanceMode,
  validateBoolean,
  clamp,
  clampVoltage,
  clampRepeatInterval,
  voltageToByte,
  byteToVoltage,
} from '../../validation.js';
import {
  ValidationError,
  InvalidChannelError,
  InvalidVoltageError,
} from '../../errors.js';

describe('Validation Constants', () => {
  it('should have correct channel range', () => {
    expect(CHANNEL_MIN).toBe(0);
    expect(CHANNEL_MAX).toBe(7);
  });

  it('should have correct voltage range', () => {
    expect(VOLTAGE_MIN).toBe(0.0);
    expect(VOLTAGE_MAX).toBe(4.08);
  });

  it('should have correct byte range', () => {
    expect(BYTE_MIN).toBe(0);
    expect(BYTE_MAX).toBe(255);
  });

  it('should have correct repeat interval range', () => {
    expect(REPEAT_INTERVAL_MIN).toBe(100);
    expect(REPEAT_INTERVAL_MAX).toBe(65535);
  });
});

describe('validateChannel', () => {
  it('should accept valid channels', () => {
    expect(() => validateChannel(0)).not.toThrow();
    expect(() => validateChannel(3)).not.toThrow();
    expect(() => validateChannel(7)).not.toThrow();
  });

  it('should throw InvalidChannelError for out of range values', () => {
    expect(() => validateChannel(-1)).toThrow(InvalidChannelError);
    expect(() => validateChannel(8)).toThrow(InvalidChannelError);
    expect(() => validateChannel(100)).toThrow(InvalidChannelError);
  });

  it('should throw ValidationError for non-number values', () => {
    expect(() => validateChannel('0')).toThrow(ValidationError);
    expect(() => validateChannel(null)).toThrow(ValidationError);
    expect(() => validateChannel(undefined)).toThrow(ValidationError);
    expect(() => validateChannel(NaN)).toThrow(ValidationError);
  });
});

describe('validateVoltage', () => {
  it('should accept valid voltages', () => {
    expect(() => validateVoltage(0)).not.toThrow();
    expect(() => validateVoltage(2.04)).not.toThrow();
    expect(() => validateVoltage(4.08)).not.toThrow();
  });

  it('should throw InvalidVoltageError for out of range values', () => {
    expect(() => validateVoltage(-0.1)).toThrow(InvalidVoltageError);
    expect(() => validateVoltage(4.09)).toThrow(InvalidVoltageError);
    expect(() => validateVoltage(10)).toThrow(InvalidVoltageError);
  });

  it('should throw ValidationError for non-number values', () => {
    expect(() => validateVoltage('2.0')).toThrow(ValidationError);
    expect(() => validateVoltage(null)).toThrow(ValidationError);
    expect(() => validateVoltage(undefined)).toThrow(ValidationError);
    expect(() => validateVoltage(NaN)).toThrow(ValidationError);
  });
});

describe('validateByte', () => {
  it('should accept valid byte values', () => {
    expect(() => validateByte(0)).not.toThrow();
    expect(() => validateByte(128)).not.toThrow();
    expect(() => validateByte(255)).not.toThrow();
  });

  it('should throw ValidationError for out of range values', () => {
    expect(() => validateByte(-1)).toThrow(ValidationError);
    expect(() => validateByte(256)).toThrow(ValidationError);
    expect(() => validateByte(1000)).toThrow(ValidationError);
  });

  it('should throw ValidationError for non-number values', () => {
    expect(() => validateByte('128')).toThrow(ValidationError);
    expect(() => validateByte(null)).toThrow(ValidationError);
    expect(() => validateByte(undefined)).toThrow(ValidationError);
    expect(() => validateByte(NaN)).toThrow(ValidationError);
  });
});

describe('validateRepeatInterval', () => {
  it('should accept valid intervals', () => {
    expect(() => validateRepeatInterval(100)).not.toThrow();
    expect(() => validateRepeatInterval(1000)).not.toThrow();
    expect(() => validateRepeatInterval(65535)).not.toThrow();
  });

  it('should throw ValidationError for out of range values', () => {
    expect(() => validateRepeatInterval(99)).toThrow(ValidationError);
    expect(() => validateRepeatInterval(65536)).toThrow(ValidationError);
    expect(() => validateRepeatInterval(0)).toThrow(ValidationError);
  });

  it('should throw ValidationError for non-number values', () => {
    expect(() => validateRepeatInterval('1000')).toThrow(ValidationError);
    expect(() => validateRepeatInterval(null)).toThrow(ValidationError);
    expect(() => validateRepeatInterval(undefined)).toThrow(ValidationError);
    expect(() => validateRepeatInterval(NaN)).toThrow(ValidationError);
  });
});

describe('validateDuration', () => {
  it('should accept valid durations', () => {
    expect(() => validateDuration(0.001)).not.toThrow();
    expect(() => validateDuration(1)).not.toThrow();
    expect(() => validateDuration(100)).not.toThrow();
  });

  it('should throw ValidationError for zero or negative values', () => {
    expect(() => validateDuration(0)).toThrow(ValidationError);
    expect(() => validateDuration(-1)).toThrow(ValidationError);
    expect(() => validateDuration(-0.001)).toThrow(ValidationError);
  });

  it('should throw ValidationError for non-number values', () => {
    expect(() => validateDuration('1')).toThrow(ValidationError);
    expect(() => validateDuration(null)).toThrow(ValidationError);
    expect(() => validateDuration(undefined)).toThrow(ValidationError);
    expect(() => validateDuration(NaN)).toThrow(ValidationError);
  });
});

describe('validateImpedanceMode', () => {
  it('should accept valid impedance modes', () => {
    expect(() => validateImpedanceMode('highz')).not.toThrow();
    expect(() => validateImpedanceMode('50ohm')).not.toThrow();
    expect(() => validateImpedanceMode('HIGHZ')).not.toThrow();
    expect(() => validateImpedanceMode('50OHM')).not.toThrow();
  });

  it('should throw ValidationError for invalid modes', () => {
    expect(() => validateImpedanceMode('100ohm')).toThrow(ValidationError);
    expect(() => validateImpedanceMode('invalid')).toThrow(ValidationError);
    expect(() => validateImpedanceMode('')).toThrow(ValidationError);
  });

  it('should throw ValidationError for non-string values', () => {
    expect(() => validateImpedanceMode(50)).toThrow(ValidationError);
    expect(() => validateImpedanceMode(null)).toThrow(ValidationError);
    expect(() => validateImpedanceMode(undefined)).toThrow(ValidationError);
  });
});

describe('validateBoolean', () => {
  it('should accept boolean values', () => {
    expect(() => validateBoolean('enabled', true)).not.toThrow();
    expect(() => validateBoolean('disabled', false)).not.toThrow();
  });

  it('should throw ValidationError for non-boolean values', () => {
    expect(() => validateBoolean('flag', 1)).toThrow(ValidationError);
    expect(() => validateBoolean('flag', 0)).toThrow(ValidationError);
    expect(() => validateBoolean('flag', 'true')).toThrow(ValidationError);
    expect(() => validateBoolean('flag', null)).toThrow(ValidationError);
    expect(() => validateBoolean('flag', undefined)).toThrow(ValidationError);
  });
});

describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('should clamp to minimum when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  it('should clamp to maximum when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
  });
});

describe('clampVoltage', () => {
  it('should clamp voltage to valid range', () => {
    expect(clampVoltage(-1)).toBe(0);
    expect(clampVoltage(0)).toBe(0);
    expect(clampVoltage(2.04)).toBe(2.04);
    expect(clampVoltage(4.08)).toBe(4.08);
    expect(clampVoltage(5)).toBe(4.08);
  });
});

describe('clampRepeatInterval', () => {
  it('should clamp interval to valid range', () => {
    expect(clampRepeatInterval(50)).toBe(100);
    expect(clampRepeatInterval(100)).toBe(100);
    expect(clampRepeatInterval(1000)).toBe(1000);
    expect(clampRepeatInterval(65535)).toBe(65535);
    expect(clampRepeatInterval(70000)).toBe(65535);
  });
});

describe('voltageToByte', () => {
  it('should convert voltage to byte correctly', () => {
    expect(voltageToByte(0)).toBe(0);
    expect(voltageToByte(4.08)).toBe(255);
    expect(voltageToByte(2.04)).toBe(128);
  });

  it('should clamp and convert out of range voltages', () => {
    expect(voltageToByte(-1)).toBe(0);
    expect(voltageToByte(5)).toBe(255);
  });
});

describe('byteToVoltage', () => {
  it('should convert byte to voltage correctly', () => {
    expect(byteToVoltage(0)).toBe(0);
    expect(byteToVoltage(255)).toBe(4.08);
    expect(byteToVoltage(128)).toBeCloseTo(2.048, 2);
  });

  it('should throw for invalid byte values', () => {
    expect(() => byteToVoltage(-1)).toThrow(ValidationError);
    expect(() => byteToVoltage(256)).toThrow(ValidationError);
    expect(() => byteToVoltage('128')).toThrow(ValidationError);
  });
});
