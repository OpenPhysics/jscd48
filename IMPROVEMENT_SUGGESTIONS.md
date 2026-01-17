# Repository Improvement Suggestions

**Date**: 2026-01-17
**Repository**: jscd48 - JavaScript Interface for CD48 Coincidence Counter

## Executive Summary

The jscd48 repository is well-structured with excellent documentation, comprehensive testing, and modern development practices. This document outlines actionable improvements across 10 key areas, prioritized by impact and effort.

**Overall Health**: 🟢 Excellent (85/100)
- Code Quality: 90/100
- Testing: 88/100
- Documentation: 85/100
- CI/CD: 80/100
- Developer Experience: 90/100

---

## Priority Matrix

| Priority | Area | Impact | Effort |
|----------|------|--------|--------|
| 🔴 **Critical** | Auto-reconnection logic | High | Medium |
| 🔴 **Critical** | TypeScript definitions for all modules | High | Low |
| 🟠 **High** | E2E tests in CI pipeline | High | Low |
| 🟠 **High** | Missing documentation (CODE_OF_CONDUCT, SECURITY) | Medium | Low |
| 🟡 **Medium** | Package.json exports completeness | Medium | Low |
| 🟡 **Medium** | Branch coverage improvement | Medium | Medium |
| 🔵 **Low** | Bundle size monitoring | Low | Low |
| 🔵 **Low** | Internationalization support | Low | High |

---

## 1. Critical Priority

### 1.1 Auto-Reconnection Logic ⚡

**File**: `cd48.js`
**Impact**: High - Production resilience
**Effort**: Medium

**Issue**: No automatic reconnection when serial connection is lost. Users must manually reconnect if the USB cable is briefly disconnected or the device resets.

**Recommendation**:
```javascript
class CD48 {
  constructor(options = {}) {
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectDelay = options.reconnectDelay ?? 1000; // ms
  }

  async _handleDisconnect() {
    if (this.autoReconnect) {
      await this._attemptReconnect();
    }
  }

  async _attemptReconnect() {
    for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * attempt));
      try {
        await this.connect();
        this._emitEvent('reconnected', { attempt });
        return;
      } catch (err) {
        if (attempt === this.maxReconnectAttempts) {
          this._emitEvent('reconnectFailed', { attempts: attempt });
        }
      }
    }
  }
}
```

**Benefits**:
- Improved production reliability
- Better user experience in long-running experiments
- Automatic recovery from transient connection issues

---

### 1.2 Complete TypeScript Definitions 📘

**Files**: Missing `analysis.d.ts`, `calibration.d.ts`, `dev-utils.d.ts`, `errors.d.ts`, `validation.d.ts`
**Impact**: High - Developer experience
**Effort**: Low

**Issue**: Only `cd48.d.ts` exists, but the library exports multiple modules without type definitions. TypeScript users get "any" types for analysis, calibration, and dev-utils modules.

**Recommendation**: Create comprehensive TypeScript definitions:

**`analysis.d.ts`**:
```typescript
export class Statistics {
  static mean(data: number[]): number;
  static median(data: number[]): number;
  static standardDeviation(data: number[]): number;
  static variance(data: number[]): number;
  static poissonUncertainty(count: number): number;
  static linearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    r2: number;
  };
  static summary(data: number[]): {
    mean: number;
    median: number;
    std: number;
    variance: number;
    min: number;
    max: number;
    count: number;
  };
}

export class Histogram {
  static create(data: number[], options: { bins: number }): HistogramResult;
  static autobin(data: number[]): HistogramResult;
  static freedmanDiaconis(data: number[]): HistogramResult;
  static cumulative(data: number[]): HistogramResult;
}

export interface HistogramResult {
  bins: number[];
  counts: number[];
  binWidth: number;
  binEdges: number[];
}

export class TimeSeries {
  static movingAverage(data: number[], window: number): number[];
  static exponentialMovingAverage(data: number[], alpha: number): number[];
  static detectOutliers(data: number[], threshold: number): number[];
  static rateOfChange(data: number[], times: number[]): number[];
  static autocorrelation(data: number[], lag: number): number;
  static deadTimeCorrection(rate: number, deadTime: number): number;
}

export class Coincidence {
  static accidentalRate(rateA: number, rateB: number, window: number): number;
  static trueCoincidenceRate(
    measured: number,
    accidental: number
  ): number;
}
```

**`calibration.d.ts`**:
```typescript
export class CalibrationProfile {
  constructor(options?: { name?: string; description?: string });
  name: string;
  description: string;
  voltages: Map<number, number>;
  thresholds: Map<number, number>;
  gains: Map<number, number>;
  offsets: Map<number, number>;

  setVoltage(channel: number, voltage: number): void;
  getVoltage(channel: number): number | undefined;
  setGain(channel: number, gain: number): void;
  getGain(channel: number): number | undefined;
  toJSON(): object;
  static fromJSON(json: object): CalibrationProfile;
}

export class CalibrationStorage {
  save(profile: CalibrationProfile): void;
  load(name: string): CalibrationProfile | null;
  list(): string[];
  delete(name: string): void;
}

export class VoltageCalibration {
  static twoPoint(
    point1: { raw: number; actual: number },
    point2: { raw: number; actual: number }
  ): { slope: number; intercept: number };

  static multiPoint(
    points: Array<{ raw: number; actual: number }>
  ): { slope: number; intercept: number; r2: number };
}

export class CalibrationWizard {
  constructor(cd48: any);

  async measureBackground(
    channels: number[],
    duration: number
  ): Promise<Map<number, number>>;

  async calibrateVoltage(
    channel: number,
    knownVoltage: number
  ): Promise<void>;

  async calibrateGain(
    channel: number,
    knownRate: number,
    duration: number
  ): Promise<void>;

  save(name: string): void;
  load(name: string): void;
}
```

**`errors.d.ts`**:
```typescript
export class CD48Error extends Error {
  constructor(message: string);
}

export class ConnectionError extends CD48Error {
  constructor(message: string);
}

export class TimeoutError extends CD48Error {
  constructor(message: string);
}

export class ValidationError extends CD48Error {
  constructor(message: string);
  field?: string;
}

export class CommandError extends CD48Error {
  constructor(message: string);
  command?: string;
}
```

**`validation.d.ts`**:
```typescript
export function validateVoltage(voltage: number): void;
export function validateChannel(channel: number): void;
export function validateDuration(duration: number): void;
export function validateWindow(window: number): void;
```

**`dev-utils.d.ts`**:
```typescript
export class DevLogger {
  constructor(options?: { prefix?: string; colors?: boolean });
  log(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
}

export class ErrorOverlay {
  show(error: Error): void;
  hide(): void;
}

export class PerformanceMonitor {
  start(label: string): void;
  end(label: string): number;
  report(): void;
}
```

**Update `package.json`**:
```json
{
  "exports": {
    ".": {
      "types": "./cd48.d.ts",
      "import": "./cd48.js",
      "require": "./dist/cd48.umd.js"
    },
    "./analysis": {
      "types": "./analysis.d.ts",
      "import": "./analysis.js"
    },
    "./calibration": {
      "types": "./calibration.d.ts",
      "import": "./calibration.js"
    },
    "./dev-utils": {
      "types": "./dev-utils.d.ts",
      "import": "./dev-utils.js"
    },
    "./errors": {
      "types": "./errors.d.ts",
      "import": "./errors.js"
    },
    "./validation": {
      "types": "./validation.d.ts",
      "import": "./validation.js"
    },
    "./dist/*": "./dist/*"
  }
}
```

**Benefits**:
- Full TypeScript IntelliSense support
- Compile-time type checking
- Better IDE autocomplete
- Reduced runtime errors
- Professional TypeScript developer experience

---

## 2. High Priority

### 2.1 E2E Tests in CI Pipeline 🧪

**File**: `.github/workflows/ci.yml`
**Impact**: High - Quality assurance
**Effort**: Low

**Issue**: E2E tests using Playwright exist but aren't run in CI pipeline. Integration issues could reach production.

**Recommendation**: Add E2E job to CI workflow:

```yaml
jobs:
  # ... existing jobs ...

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build project
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: tests/e2e-screenshots/
          retention-days: 7
```

**Benefits**:
- Catch integration bugs before deployment
- Validate all 11 examples work correctly
- Visual regression detection
- Automated cross-browser testing

---

### 2.2 Missing Documentation Files 📚

**Files**: Missing `CODE_OF_CONDUCT.md`, `SECURITY.md`
**Impact**: Medium - Community health
**Effort**: Low

**Issue**:
- `CODE_OF_CONDUCT.md` referenced in `CONTRIBUTING.md:7` but doesn't exist
- No `SECURITY.md` for vulnerability reporting

**Recommendation**:

**`CODE_OF_CONDUCT.md`**:
```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual
identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior:

* The use of sexualized language or imagery and unwelcome sexual attention
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information without explicit permission
* Other conduct which could reasonably be considered inappropriate

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
[INSERT EMAIL].

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
https://www.contributor-covenant.org/version/2/1/code_of_conduct.html

[homepage]: https://www.contributor-covenant.org
```

**`SECURITY.md`**:
```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in jscd48,
please report it responsibly.

### How to Report

**DO NOT** open a public issue. Instead:

1. Email security concerns to: [INSERT EMAIL]
2. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

### Security Best Practices

When using jscd48:

1. **HTTPS Required**: Web Serial API requires secure context
2. **User Gesture**: Connection requires user interaction
3. **Input Validation**: All device inputs are validated
4. **No Credential Storage**: Library doesn't store sensitive data
5. **Dependency Updates**: Keep dependencies current

### Known Security Considerations

- **Web Serial API**: Requires Chrome 89+, Edge 89+, or Opera 76+
- **User Permissions**: User must explicitly grant serial port access
- **USB Access**: Physical device access required
- **No Remote Access**: Library doesn't support remote device connections

### Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers
in our changelog (unless anonymity is requested).
```

**Benefits**:
- Clear community guidelines
- Professional vulnerability disclosure process
- Increased contributor confidence
- Better GitHub repository health score

---

### 2.3 Measurement Uncertainty Calculations 📊

**File**: `cd48.js` (lines 352-366)
**Impact**: High - Scientific accuracy
**Effort**: Low

**Issue**: `measureRate()` and `measureCoincidenceRate()` don't include Poisson statistical uncertainty, which is critical for scientific measurements.

**Recommendation**:

```javascript
async measureRate(channel, duration) {
  validateChannel(channel);
  validateDuration(duration);

  await this.clearCounts();
  const startTime = Date.now();
  await this.sleep(duration * 1000);
  const endTime = Date.now();

  const data = await this.getCounts();
  const actualDuration = (endTime - startTime) / 1000;
  const counts = data.counts[channel];
  const rate = counts / actualDuration;

  // Add Poisson uncertainty
  const countUncertainty = Math.sqrt(counts);
  const rateUncertainty = countUncertainty / actualDuration;
  const relativeUncertainty = counts > 0 ? countUncertainty / counts : 1.0;

  return {
    counts,
    duration: actualDuration,
    rate,
    uncertainty: rateUncertainty,
    relativeUncertainty,
    channel,
  };
}

async measureCoincidenceRate(options) {
  // ... existing code ...

  // Add uncertainties
  const singlesAUncertainty = Math.sqrt(singlesA) / duration;
  const singlesBUncertainty = Math.sqrt(singlesB) / duration;
  const coincidenceUncertainty = Math.sqrt(coincidences) / duration;

  // Propagate uncertainty for true coincidence rate
  const accidentalUncertainty = accidentalRate * Math.sqrt(
    (singlesAUncertainty / rateA) ** 2 +
    (singlesBUncertainty / rateB) ** 2
  );

  const trueCoincidenceUncertainty = Math.sqrt(
    coincidenceUncertainty ** 2 + accidentalUncertainty ** 2
  );

  return {
    // ... existing return values ...
    uncertainties: {
      rateA: singlesAUncertainty,
      rateB: singlesBUncertainty,
      coincidenceRate: coincidenceUncertainty,
      accidentalRate: accidentalUncertainty,
      trueCoincidenceRate: trueCoincidenceUncertainty,
    },
  };
}
```

**Benefits**:
- Scientific accuracy for research applications
- Proper error propagation
- Publication-ready measurements
- Better alignment with physics best practices

---

## 3. Medium Priority

### 3.1 Complete Package.json Exports 📦

**File**: `package.json` (lines 9-22)
**Impact**: Medium - API accessibility
**Effort**: Low

**Issue**: `errors.js`, `validation.js`, and `dev-utils.js` aren't exported in package.json, making them inaccessible to library users.

**Recommendation**:

```json
{
  "exports": {
    ".": {
      "types": "./cd48.d.ts",
      "import": "./cd48.js",
      "require": "./dist/cd48.umd.js"
    },
    "./analysis": {
      "types": "./analysis.d.ts",
      "import": "./analysis.js"
    },
    "./calibration": {
      "types": "./calibration.d.ts",
      "import": "./calibration.js"
    },
    "./dev-utils": {
      "types": "./dev-utils.d.ts",
      "import": "./dev-utils.js"
    },
    "./errors": {
      "types": "./errors.d.ts",
      "import": "./errors.js"
    },
    "./validation": {
      "types": "./validation.d.ts",
      "import": "./validation.js"
    },
    "./dist/*": "./dist/*"
  }
}
```

**Benefits**:
- Users can import custom error classes for type checking
- Access to validation utilities for custom workflows
- DevLogger available for debugging
- Better API completeness

---

### 3.2 Improve Branch Coverage 📈

**File**: `vitest.config.js` (line 17)
**Impact**: Medium - Code quality
**Effort**: Medium

**Issue**: Branch coverage at 88.33% is below industry standard of 90%+.

**Recommendation**: Add tests for:

1. **Error handling branches** in `cd48.js`:
   - Timeout scenarios
   - Invalid responses
   - Connection failures mid-command

2. **Edge cases** in `validation.js`:
   - Boundary values (0, max voltage, etc.)
   - Invalid types (string instead of number)

3. **Calibration edge cases** in `calibration.js`:
   - Empty profiles
   - Missing localStorage
   - Corrupted stored data

**Example test additions**:

```javascript
// tests/unit/cd48.test.js
describe('CD48 Error Handling', () => {
  it('should handle timeout during read', async () => {
    // Mock slow response
    const cd48 = new CD48();
    cd48.readTimeout = 100; // Short timeout

    // Test timeout branch
    await expect(cd48.getCounts()).rejects.toThrow(TimeoutError);
  });

  it('should handle invalid response format', async () => {
    // Mock malformed response
    // Test parsing error branch
  });
});

// tests/unit/validation.test.js
describe('Validation Edge Cases', () => {
  it('should reject voltage exactly at upper limit + epsilon', () => {
    expect(() => validateVoltage(4.08 + 0.001)).toThrow(ValidationError);
  });

  it('should reject non-numeric voltage', () => {
    expect(() => validateVoltage('2.5')).toThrow(ValidationError);
  });
});
```

**Target**: Increase to 90%+ branch coverage

**Benefits**:
- Catch edge case bugs
- Improve robustness
- Better error handling
- Higher code quality confidence

---

### 3.3 JSDoc Configuration Completeness 📖

**File**: `jsdoc.json`
**Impact**: Medium - Documentation
**Effort**: Low

**Issue**: Only includes `cd48.js` and `README.md`, missing other modules.

**Recommendation**:

```json
{
  "source": {
    "include": [
      "cd48.js",
      "analysis.js",
      "calibration.js",
      "dev-utils.js",
      "errors.js",
      "validation.js",
      "README.md"
    ],
    "includePattern": ".+\\.js$",
    "excludePattern": "(node_modules/|dist/|tests/)"
  },
  "opts": {
    "template": "node_modules/docdash",
    "encoding": "utf8",
    "destination": "docs/api/",
    "recurse": true,
    "readme": "README.md"
  },
  "plugins": ["plugins/markdown"],
  "templates": {
    "cleverLinks": true,
    "monospaceLinks": true,
    "default": {
      "outputSourceFiles": true
    }
  },
  "docdash": {
    "static": true,
    "sort": true,
    "search": true,
    "collapse": true,
    "typedefs": true,
    "removeQuotes": "none",
    "scripts": [],
    "menu": {
      "GitHub": {
        "href": "https://github.com/OpenPhysics/jscd48",
        "target": "_blank"
      },
      "NPM": {
        "href": "https://www.npmjs.com/package/jscd48",
        "target": "_blank"
      }
    }
  }
}
```

**Benefits**:
- Complete API documentation
- Better developer onboarding
- Professional documentation site
- All modules documented

---

### 3.4 Rate Limiting for Commands 🚦

**File**: `cd48.js`
**Impact**: Medium - Device protection
**Effort**: Low

**Issue**: No protection against command flooding, which could overwhelm the device.

**Recommendation**:

```javascript
class CD48 {
  constructor(options = {}) {
    // ... existing code ...
    this.commandsPerSecond = options.commandsPerSecond ?? 20;
    this.commandQueue = [];
    this.lastCommandTime = 0;
  }

  async _throttleCommand() {
    const now = Date.now();
    const minDelay = 1000 / this.commandsPerSecond;
    const timeSinceLastCommand = now - this.lastCommandTime;

    if (timeSinceLastCommand < minDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, minDelay - timeSinceLastCommand)
      );
    }

    this.lastCommandTime = Date.now();
  }

  async sendCommand(command) {
    await this._throttleCommand();
    return this._sendCommandInternal(command);
  }
}
```

**Benefits**:
- Protect device from overwhelming
- Predictable performance
- Prevents timeout cascades
- Better long-term reliability

---

## 4. Low Priority

### 4.1 Bundle Size Monitoring 📊

**File**: `.github/workflows/ci.yml`
**Impact**: Low - Performance awareness
**Effort**: Low

**Issue**: No tracking of bundle size changes over time.

**Recommendation**:

```yaml
jobs:
  bundle-size:
    name: Bundle Size Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build bundles
        run: npm run build

      - name: Check bundle sizes
        run: |
          echo "ESM Bundle:"
          ls -lh dist/cd48.esm.min.js

          echo "UMD Bundle:"
          ls -lh dist/cd48.umd.min.js

          # Fail if bundle exceeds 10KB
          SIZE=$(wc -c < dist/cd48.esm.min.js)
          if [ $SIZE -gt 10240 ]; then
            echo "Bundle size exceeds 10KB limit: $SIZE bytes"
            exit 1
          fi

      - name: Upload size report
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

**Benefits**:
- Track bundle size growth
- Prevent accidental bloat
- Performance awareness
- Size budget enforcement

---

### 4.2 Source Maps for Minified Builds 🗺️

**File**: `vite.config.min.js`
**Impact**: Low - Debugging
**Effort**: Low

**Issue**: Minified builds don't include source maps, making production debugging harder.

**Recommendation**:

```javascript
export default defineConfig({
  // ... existing config ...
  build: {
    sourcemap: true, // Add this
    // ... rest of config ...
  },
});
```

**Benefits**:
- Easier production debugging
- Better error stack traces
- Developer-friendly debugging

---

### 4.3 Node Version Matrix Update 🔄

**File**: `.github/workflows/ci.yml` (line 43)
**Impact**: Low - Future-proofing
**Effort**: Low

**Issue**: Testing Node 18, which reaches EOL in April 2025.

**Recommendation**:

```yaml
strategy:
  matrix:
    node-version: [20, 22, 23]
```

**Benefits**:
- Test on currently supported Node versions
- Prepare for future Node releases
- Avoid EOL version testing

---

### 4.4 Changelog Automation 📝

**File**: `.github/workflows/release.yml`
**Impact**: Low - Maintenance
**Effort**: Medium

**Issue**: CHANGELOG.md must be manually updated.

**Recommendation**:

Install conventional-changelog:
```bash
npm install --save-dev conventional-changelog-cli
```

Add script to `package.json`:
```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

Update release workflow:
```yaml
- name: Generate Changelog
  run: npm run changelog

- name: Commit Changelog
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add CHANGELOG.md
    git commit -m "docs: update changelog for ${{ github.ref_name }}" || true
```

**Benefits**:
- Automatic changelog generation
- Consistent format
- Less manual work
- Never forget to update changelog

---

## 5. Additional Recommendations

### 5.1 Performance Benchmarking in CI ⚡

**File**: `.github/workflows/ci.yml`
**Effort**: Low

Add benchmark job:
```yaml
jobs:
  benchmark:
    name: Performance Benchmarks
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run benchmarks
        run: npm run test:bench

      - name: Store benchmark result
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'benchmarkjs'
          output-file-path: benchmark-results.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true
```

---

### 5.2 Pre-release Pipeline 🚀

**File**: `.github/workflows/release.yml`

Add beta release capability:
```yaml
on:
  push:
    branches:
      - main
      - beta
    tags:
      - 'v*'
      - 'v*-beta.*'

jobs:
  release:
    steps:
      - name: Determine release type
        id: release-type
        run: |
          if [[ $GITHUB_REF == *"beta"* ]]; then
            echo "type=beta" >> $GITHUB_OUTPUT
            echo "npm-tag=beta" >> $GITHUB_OUTPUT
          else
            echo "type=stable" >> $GITHUB_OUTPUT
            echo "npm-tag=latest" >> $GITHUB_OUTPUT
          fi

      - name: Publish to NPM
        run: npm publish --tag ${{ steps.release-type.outputs.npm-tag }}
```

---

### 5.3 Migration Guide 📚

**File**: `MIGRATION.md` (new)

Create upgrade documentation:
```markdown
# Migration Guide

## Upgrading to v2.0.0 (Future)

### Breaking Changes

1. **Auto-reconnect enabled by default**
   ```javascript
   // Old behavior (manual reconnect)
   const cd48 = new CD48();

   // New behavior (auto-reconnect enabled)
   const cd48 = new CD48({ autoReconnect: true });

   // To disable auto-reconnect
   const cd48 = new CD48({ autoReconnect: false });
   ```

2. **measureRate() now includes uncertainty**
   ```javascript
   // Old return value
   { counts, duration, rate, channel }

   // New return value
   { counts, duration, rate, channel, uncertainty, relativeUncertainty }
   ```

### Deprecated Features

None currently.

## Upgrading from v0.x to v1.0.0

No breaking changes. v1.0.0 is a feature-stable release.
```

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
1. ✅ Create TypeScript definitions for all modules
2. ✅ Add CODE_OF_CONDUCT.md and SECURITY.md
3. ✅ Update package.json exports
4. ✅ Fix JSDoc configuration
5. ✅ Add E2E tests to CI

### Phase 2: Core Improvements (3-5 days)
1. ✅ Implement auto-reconnection logic
2. ✅ Add measurement uncertainties
3. ✅ Implement rate limiting
4. ✅ Improve branch coverage to 90%+

### Phase 3: Infrastructure (2-3 days)
1. ✅ Add bundle size monitoring
2. ✅ Set up changelog automation
3. ✅ Add performance benchmarking
4. ✅ Create pre-release pipeline

### Phase 4: Polish (ongoing)
1. ✅ Source maps for minified builds
2. ✅ Update Node version matrix
3. ✅ Create migration guide
4. ✅ Monitor and maintain

---

## Metrics and Success Criteria

### Before Improvements
- TypeScript coverage: 25% (only cd48.d.ts)
- Branch coverage: 88.33%
- E2E in CI: ❌
- Bundle monitoring: ❌
- Security docs: ❌
- Auto-reconnect: ❌

### After Improvements (Target)
- TypeScript coverage: 100% (all modules)
- Branch coverage: 90%+
- E2E in CI: ✅
- Bundle monitoring: ✅
- Security docs: ✅
- Auto-reconnect: ✅

---

## Conclusion

The jscd48 repository is in excellent shape with strong fundamentals. These improvements will:

1. **Enhance TypeScript support** - Critical for modern JavaScript development
2. **Improve production reliability** - Auto-reconnect and rate limiting
3. **Strengthen testing** - E2E in CI and better coverage
4. **Complete documentation** - Security policy and code of conduct
5. **Add scientific rigor** - Measurement uncertainties
6. **Streamline maintenance** - Automated changelog and bundle monitoring

**Estimated Total Effort**: 6-10 days of development work

**Impact**: Transforms a good library into a production-ready, enterprise-grade solution

---

**Questions or feedback?** Open an issue on GitHub or contact the maintainers.
