/**
 * Utility types for advanced TypeScript patterns
 * @module types
 */

/**
 * Deep readonly type - makes all nested properties readonly
 * @example
 * type Person = { name: string; address: { city: string } };
 * type ReadonlyPerson = DeepReadonly<Person>;
 * // { readonly name: string; readonly address: { readonly city: string } }
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends (...args: never[]) => unknown
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

/**
 * Non-empty array type - ensures array has at least one element
 * @example
 * const numbers: NonEmptyArray<number> = [1, 2, 3]; // OK
 * const empty: NonEmptyArray<number> = []; // Error
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Result type for operations that can succeed or fail
 * Discriminated union for type-safe error handling
 * @example
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) return { success: false, error: new Error('Division by zero') };
 *   return { success: true, data: a / b };
 * }
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Optional type - value can be T or undefined (more explicit than T?)
 * @example
 * function findUser(id: string): Optional<User> { ... }
 */
export type Optional<T> = T | undefined;

/**
 * Nullable type - value can be T or null
 * @example
 * let port: Nullable<SerialPort> = null;
 */
export type Nullable<T> = T | null;

/**
 * Connection state as discriminated union
 * Enables exhaustive type checking and eliminates null checks
 */
export type ConnectionState =
  | { readonly status: 'disconnected' }
  | { readonly status: 'connecting' }
  | { readonly status: 'connected'; readonly port: SerialPort }
  | { readonly status: 'reconnecting'; readonly attempt: number }
  | { readonly status: 'failed'; readonly error: Error };

/**
 * Measurement result with discriminated union
 * Type-safe success/failure handling
 */
export type MeasurementResult<T> = Result<T, MeasurementError>;

/**
 * Measurement error types
 */
export type MeasurementError =
  | { readonly type: 'not_connected'; readonly message: string }
  | { readonly type: 'timeout'; readonly duration: number }
  | { readonly type: 'invalid_response'; readonly response: string }
  | { readonly type: 'hardware_error'; readonly cause: Error };

/**
 * Extract readonly property keys from type
 * @example
 * type Person = { readonly name: string; age: number };
 * type ReadonlyKeys = ReadonlyKeys<Person>; // 'name'
 */
export type ReadonlyKeys<T> = {
  [P in keyof T]-?: (<F>() => F extends { [Q in P]: T[P] } ? 1 : 2) extends <
    F,
  >() => F extends { -readonly [Q in P]: T[P] } ? 1 : 2
    ? never
    : P;
}[keyof T];

/**
 * Extract writable property keys from type
 */
export type WritableKeys<T> = {
  [P in keyof T]-?: (<F>() => F extends { [Q in P]: T[P] } ? 1 : 2) extends <
    F,
  >() => F extends { -readonly [Q in P]: T[P] } ? 1 : 2
    ? P
    : never;
}[keyof T];

/**
 * Require at least one property from T
 * @example
 * type Options = AtLeastOne<{ a?: string; b?: number; c?: boolean }>;
 * const valid: Options = { a: 'test' }; // OK
 * const invalid: Options = {}; // Error
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

/**
 * Exact type - disallows additional properties
 * @example
 * type Point = Exact<{ x: number; y: number }>;
 * const p: Point = { x: 1, y: 2 }; // OK
 * const bad: Point = { x: 1, y: 2, z: 3 }; // Error
 */
export type Exact<T extends object> = T & {
  [K in Exclude<keyof T, keyof T>]: never;
};
