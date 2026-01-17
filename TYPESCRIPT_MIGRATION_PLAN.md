# TypeScript Migration Plan for jscd48

## Executive Summary

This document outlines the comprehensive plan to convert the jscd48 repository from JavaScript to TypeScript. The project is a JavaScript interface for controlling the Red Dog Physics CD48 Coincidence Counter using the Web Serial API.

### Current State
- **Source Code**: 6 modules, ~2,186 lines of JavaScript
- **Test Code**: 12 files, ~3,088 lines
- **Type Definitions**: 11 existing `.d.ts` files (with duplication)
- **Module System**: ES Modules
- **Build Tool**: Vite 7.3.1

### Migration Complexity: **Medium-High**
The codebase is well-structured for migration with existing type definitions and modern ES module architecture.

---

## Phase 1: Infrastructure Setup

### 1.1 Create TypeScript Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests", "examples"]
}
```

**File**: `tsconfig.test.json` (for tests)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

### 1.2 Install TypeScript Dependencies

```bash
npm install --save-dev typescript @types/node
```

### 1.3 Update Vite Configuration for TypeScript

Update `vite.config.build.js` to handle TypeScript:

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cd48.ts'),
      name: 'CD48',
      formats: ['es', 'umd'],
      fileName: (format) => `cd48.${format}.js`
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
});
```

### 1.4 Create Source Directory Structure

```
jscd48/
├── src/
│   ├── cd48.ts           (main module)
│   ├── analysis.ts       (statistical analysis)
│   ├── calibration.ts    (calibration tools)
│   ├── dev-utils.ts      (development utilities)
│   ├── errors.ts         (error classes)
│   ├── validation.ts     (validation utilities)
│   ├── types/
│   │   └── index.ts      (consolidated type exports)
│   └── index.ts          (main entry point)
├── tests/
│   └── ... (test files)
├── dist/
│   └── ... (build output)
└── examples/
    └── ... (HTML examples)
```

### 1.5 Consolidate Type Definitions

Current state has duplicate `.d.ts` files in root and `types/` folder. Consolidate into:

```
src/types/
├── index.ts          (re-exports all types)
├── cd48.types.ts     (CD48 class types)
├── analysis.types.ts (analysis module types)
├── calibration.types.ts
├── dev-utils.types.ts
├── errors.types.ts
└── validation.types.ts
```

---

## Phase 2: Source File Conversion

Convert files in order of increasing complexity to catch issues early.

### 2.1 Convert `errors.js` to `errors.ts` (Lowest complexity)

**Current**: 129 lines
**Estimated effort**: Low

```typescript
// src/errors.ts
export class CD48Error extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = 'CD48Error';
    this.code = code;
    this.originalError = originalError;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotConnectedError extends CD48Error {
  constructor(message = 'Not connected to CD48 device') {
    super(message, 'NOT_CONNECTED');
    this.name = 'NotConnectedError';
  }
}

export class CommunicationError extends CD48Error {
  constructor(message: string, originalError?: Error) {
    super(message, 'COMMUNICATION_ERROR', originalError);
    this.name = 'CommunicationError';
  }
}

export class ValidationError extends CD48Error {
  public readonly field: string;
  public readonly value: unknown;

  constructor(message: string, field: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class TimeoutError extends CD48Error {
  public readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export class ConfigurationError extends CD48Error {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class CalibrationError extends CD48Error {
  constructor(message: string) {
    super(message, 'CALIBRATION_ERROR');
    this.name = 'CalibrationError';
  }
}
```

### 2.2 Convert `validation.js` to `validation.ts`

**Current**: 206 lines
**Estimated effort**: Low

Key types needed:
```typescript
// src/validation.ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ChannelRange {
  min: number;
  max: number;
}

export const CHANNEL_RANGE: ChannelRange = { min: 0, max: 3 };
export const WINDOW_RANGE: ChannelRange = { min: 0, max: 255 };
export const DELAY_RANGE: ChannelRange = { min: 0, max: 65535 };

export function validateChannel(channel: number): boolean { /* ... */ }
export function validateWindow(window: number): boolean { /* ... */ }
export function validateDelay(delay: number): boolean { /* ... */ }
export function validateOptions(options: Record<string, unknown>): ValidationResult { /* ... */ }
```

### 2.3 Convert `analysis.js` to `analysis.ts`

**Current**: 468 lines
**Estimated effort**: Medium

```typescript
// src/analysis.ts
export interface StatisticalResult {
  mean: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  frequency: number;
}

export interface HistogramResult {
  bins: HistogramBin[];
  totalCount: number;
  binWidth: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  uncertainty?: number;
}

export namespace Statistics {
  export function calculate(data: number[]): StatisticalResult;
  export function mean(data: number[]): number;
  export function variance(data: number[]): number;
  export function stdDev(data: number[]): number;
  export function poissonUncertainty(count: number): number;
}

export namespace Histogram {
  export function create(data: number[], bins?: number): HistogramResult;
  export function normalize(histogram: HistogramResult): HistogramResult;
}

export namespace TimeSeries {
  export function create(capacity?: number): TimeSeriesStore;
  export function add(series: TimeSeriesStore, point: TimeSeriesPoint): void;
  export function getRange(series: TimeSeriesStore, start: number, end: number): TimeSeriesPoint[];
}

export namespace Coincidence {
  export function calculateRate(counts: number[], interval: number): number[];
  export function calculateUncertainty(rate: number, interval: number): number;
}
```

### 2.4 Convert `calibration.js` to `calibration.ts`

**Current**: 520 lines
**Estimated effort**: Medium

```typescript
// src/calibration.ts
export interface CalibrationProfile {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  channels: ChannelCalibration[];
  metadata?: Record<string, unknown>;
}

export interface ChannelCalibration {
  channel: number;
  offset: number;
  gain: number;
  windowSize: number;
  delay: number;
}

export interface CalibrationStorageOptions {
  storageKey?: string;
  maxProfiles?: number;
}

export class CalibrationStorage {
  constructor(options?: CalibrationStorageOptions);
  save(profile: CalibrationProfile): void;
  load(id: string): CalibrationProfile | null;
  list(): CalibrationProfile[];
  delete(id: string): boolean;
  clear(): void;
}

export interface WizardStep {
  name: string;
  description: string;
  execute: () => Promise<void>;
}

export class CalibrationWizard {
  constructor(cd48: CD48, options?: WizardOptions);
  start(): Promise<CalibrationProfile>;
  cancel(): void;
  getCurrentStep(): WizardStep;
  getProgress(): number;
}
```

### 2.5 Convert `dev-utils.js` to `dev-utils.ts`

**Current**: 458 lines
**Estimated effort**: Medium

```typescript
// src/dev-utils.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
}

export interface DevLoggerOptions {
  enabled?: boolean;
  level?: LogLevel;
  maxEntries?: number;
  console?: boolean;
}

export class DevLogger {
  constructor(options?: DevLoggerOptions);
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  getEntries(): LogEntry[];
  clear(): void;
}

export interface ErrorOverlayOptions {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class ErrorOverlay {
  constructor(options?: ErrorOverlayOptions);
  show(error: Error): void;
  hide(): void;
  destroy(): void;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  timing: Record<string, number>;
}

export class PerformanceMonitor {
  constructor();
  start(label: string): void;
  end(label: string): number;
  getMetrics(): PerformanceMetrics;
  reset(): void;
}
```

### 2.6 Convert `cd48.js` to `cd48.ts` (Highest complexity)

**Current**: 605 lines
**Estimated effort**: High

This is the most complex module with:
- Web Serial API integration
- Async communication patterns
- Auto-reconnection logic
- Rate limiting
- Complex state management

```typescript
// src/cd48.ts
import type {
  CD48Options,
  CountData,
  RateUncertainty,
  ChannelInputs,
  ConnectionState,
  CommandResponse
} from './types';

export interface CD48Events {
  connect: () => void;
  disconnect: () => void;
  data: (data: CountData) => void;
  error: (error: Error) => void;
  reconnecting: (attempt: number) => void;
}

export type CD48EventName = keyof CD48Events;

export interface CD48Options {
  baudRate?: number;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  rateLimitMs?: number;
  defaultWindow?: number;
  defaultDelay?: number;
  logger?: DevLogger;
}

export default class CD48 {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private eventListeners: Map<CD48EventName, Set<Function>> = new Map();
  private options: Required<CD48Options>;

  constructor(options?: CD48Options);

  // Connection methods
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionState(): ConnectionState;

  // Data methods
  async getCounts(): Promise<CountData>;
  async getCountsWithUncertainty(): Promise<CountData & { uncertainties: RateUncertainty }>;
  async startContinuousReading(intervalMs?: number): Promise<void>;
  stopContinuousReading(): void;

  // Configuration methods
  async setWindow(channel: number, size: number): Promise<void>;
  async setDelay(channel: number, delay: number): Promise<void>;
  async setChannelInputs(inputs: ChannelInputs): Promise<void>;

  // Event methods
  on<E extends CD48EventName>(event: E, callback: CD48Events[E]): void;
  off<E extends CD48EventName>(event: E, callback: CD48Events[E]): void;
  once<E extends CD48EventName>(event: E, callback: CD48Events[E]): void;

  // Internal methods (private)
  private sendCommand(command: string): Promise<CommandResponse>;
  private parseResponse(data: Uint8Array): CommandResponse;
  private handleReconnect(): Promise<void>;
  private emit<E extends CD48EventName>(event: E, ...args: Parameters<CD48Events[E]>): void;
}
```

---

## Phase 3: Test Conversion

### 3.1 Update Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95
      }
    }
  }
});
```

### 3.2 Convert Test Files

**Order of conversion**:
1. `tests/mocks/web-serial.ts` - Mock Web Serial API with proper types
2. `tests/mocks/mock-cd48.ts` - Mock CD48 instance
3. `tests/unit/errors.test.ts`
4. `tests/unit/validation.test.ts`
5. `tests/unit/cd48.test.ts`
6. `tests/integration/cd48-integration.test.ts`
7. `tests/benchmarks/cd48.bench.ts`

### 3.3 Type-Safe Mocks

```typescript
// tests/mocks/web-serial.ts
export interface MockSerialPort {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  open: jest.Mock<Promise<void>>;
  close: jest.Mock<Promise<void>>;
  getInfo: () => SerialPortInfo;
}

export function createMockSerialPort(responses?: Uint8Array[]): MockSerialPort;
export function mockNavigatorSerial(): void;
export function restoreNavigatorSerial(): void;
```

### 3.4 Convert Playwright E2E Tests

```typescript
// tests/e2e/main-interface.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Main Interface', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/examples/index.html');
  });

  test('should display connection status', async ({ page }) => {
    const status = page.locator('#connection-status');
    await expect(status).toHaveText('Disconnected');
  });
});
```

---

## Phase 4: Build & Package Updates

### 4.1 Update package.json

```json
{
  "name": "jscd48",
  "version": "1.1.0",
  "type": "module",
  "main": "./dist/cd48.umd.js",
  "module": "./dist/cd48.esm.js",
  "types": "./dist/cd48.d.ts",
  "exports": {
    ".": {
      "types": "./dist/cd48.d.ts",
      "import": "./dist/cd48.esm.js",
      "require": "./dist/cd48.umd.js"
    },
    "./errors": {
      "types": "./dist/errors.d.ts",
      "import": "./dist/errors.js"
    },
    "./validation": {
      "types": "./dist/validation.d.ts",
      "import": "./dist/validation.js"
    },
    "./analysis": {
      "types": "./dist/analysis.d.ts",
      "import": "./dist/analysis.js"
    },
    "./calibration": {
      "types": "./dist/calibration.d.ts",
      "import": "./dist/calibration.js"
    },
    "./dev-utils": {
      "types": "./dist/dev-utils.d.ts",
      "import": "./dist/dev-utils.js"
    }
  },
  "scripts": {
    "build": "tsc && vite build",
    "build:types": "tsc --emitDeclarationOnly",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src tests --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\""
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0"
  }
}
```

### 4.2 Update ESLint Configuration

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/strict-boolean-expressions': 'error',
    },
  }
);
```

### 4.3 Update .gitignore

```
# TypeScript
*.tsbuildinfo
dist/

# Keep existing entries
node_modules/
coverage/
.cache/
```

---

## Phase 5: Documentation & Examples

### 5.1 Update README.md

Add TypeScript usage examples:

```markdown
## TypeScript Usage

```typescript
import CD48, { type CD48Options, type CountData } from 'jscd48';
import { Statistics } from 'jscd48/analysis';

const options: CD48Options = {
  baudRate: 115200,
  autoReconnect: true,
};

const device = new CD48(options);

device.on('data', (data: CountData) => {
  const stats = Statistics.calculate(data.counts);
  console.log(`Mean: ${stats.mean}, StdDev: ${stats.stdDev}`);
});

await device.connect();
```
```

### 5.2 Update HTML Examples

Add TypeScript compilation notes and update inline scripts to reference compiled JS:

```html
<!-- examples/index.html -->
<script type="module">
  // Import from compiled distribution
  import CD48 from '../dist/cd48.esm.js';
  // ...
</script>
```

### 5.3 Generate API Documentation

Update JSDoc configuration for TypeScript:

```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".+\\.ts$"
  },
  "plugins": ["plugins/typescript"],
  "templates": {
    "default": {
      "includeDate": false
    }
  }
}
```

---

## Migration Checklist

### Phase 1: Infrastructure
- [ ] Create `tsconfig.json`
- [ ] Create `tsconfig.test.json`
- [ ] Install TypeScript dependencies
- [ ] Create `src/` directory structure
- [ ] Update Vite configuration
- [ ] Consolidate duplicate `.d.ts` files
- [ ] Update `.gitignore`

### Phase 2: Source Conversion
- [ ] Convert `errors.js` to `errors.ts`
- [ ] Convert `validation.js` to `validation.ts`
- [ ] Convert `analysis.js` to `analysis.ts`
- [ ] Convert `calibration.js` to `calibration.ts`
- [ ] Convert `dev-utils.js` to `dev-utils.ts`
- [ ] Convert `cd48.js` to `cd48.ts`
- [ ] Create `src/index.ts` entry point
- [ ] Verify all imports/exports work

### Phase 3: Test Conversion
- [ ] Update `vitest.config.js` to TypeScript
- [ ] Convert mock files to TypeScript
- [ ] Convert unit tests
- [ ] Convert integration tests
- [ ] Convert E2E tests (Playwright)
- [ ] Convert benchmark tests
- [ ] Verify all tests pass

### Phase 4: Build & Package
- [ ] Update `package.json` exports
- [ ] Update build scripts
- [ ] Update ESLint configuration
- [ ] Verify build output
- [ ] Test package installation locally
- [ ] Verify type definitions are included in dist

### Phase 5: Documentation
- [ ] Update README.md with TypeScript examples
- [ ] Update API documentation generation
- [ ] Update HTML examples
- [ ] Update CONTRIBUTING.md (if exists)

---

## Rollback Strategy

If issues arise during migration:

1. **Keep original `.js` files** until migration is fully verified
2. **Use feature branch** for migration work
3. **Maintain parallel builds** during transition:
   ```json
   {
     "scripts": {
       "build:js": "vite build --config vite.config.js.bak",
       "build:ts": "tsc && vite build"
     }
   }
   ```
4. **Version bump** to indicate breaking change (1.x.x to 2.0.0)

---

## Success Criteria

The migration is complete when:

1. All source files are TypeScript (`.ts`)
2. All tests pass with same or better coverage (95%+)
3. Build produces valid ESM and UMD bundles
4. Type definitions are auto-generated and accurate
5. No `any` types except where absolutely necessary
6. All examples work with compiled output
7. npm package installs and works correctly
8. CI/CD pipeline passes all checks

---

## Notes

### Preserving Backward Compatibility

- Maintain same public API surface
- Keep same export names and structures
- Ensure compiled JS output is compatible with existing consumers
- Consider providing migration guide for TypeScript consumers

### Web Serial API Types

The Web Serial API may require additional type definitions:

```bash
npm install --save-dev @types/w3c-web-serial
```

Or define locally in `src/types/web-serial.d.ts` if the package types are incomplete.

### Strict Mode Considerations

Enabling `strict: true` in TypeScript will catch:
- Implicit `any` types
- Null/undefined issues
- Incorrect function signatures
- Missing return types

Address these systematically during conversion.
