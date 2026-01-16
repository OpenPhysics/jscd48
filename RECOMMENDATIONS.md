# Repository Recommendations for jscd48

This document contains recommendations to improve code quality, maintainability, security, and developer experience for the jscd48 project.

## High Priority Recommendations

### 1. Add Essential Project Files

#### .gitignore
Create a `.gitignore` file to exclude common files:
```gitignore
# Dependencies
node_modules/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Build outputs
dist/
build/
*.log

# Environment files
.env
.env.local
```

#### CONTRIBUTING.md
Add contribution guidelines to help potential contributors understand:
- How to set up the development environment
- Coding standards and conventions
- How to submit issues and pull requests
- Testing requirements

### 2. Add Testing Infrastructure

Currently, there are no tests in the repository. Recommend adding:

**Unit Tests for cd48.js**
- Use Jest or Vitest for testing
- Mock the Web Serial API for unit tests
- Test all public methods of the CD48 class
- Aim for >80% code coverage

**Example structure:**
```
tests/
  ├── unit/
  │   └── cd48.test.js
  ├── integration/
  │   └── serial-communication.test.js
  └── setup.js
```

**Sample test setup in package.json:**
```json
"devDependencies": {
  "vitest": "^1.0.0",
  "@vitest/ui": "^1.0.0"
},
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

### 3. Add Code Quality Tools

#### ESLint
Set up ESLint for consistent code style:
```bash
npm install --save-dev eslint
```

Create `.eslintrc.json`:
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "off"
  }
}
```

#### Prettier
Add Prettier for code formatting:
```json
"devDependencies": {
  "prettier": "^3.0.0"
},
"scripts": {
  "format": "prettier --write \"**/*.{js,json,md,html}\"",
  "format:check": "prettier --check \"**/*.{js,json,md,html}\""
}
```

### 4. Enhance CI/CD Pipeline

Current workflow only deploys to GitHub Pages. Add a comprehensive CI workflow:

**`.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm test
      - run: npm run test:coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify files
        run: |
          test -f cd48.js
          test -f index.html
```

### 5. Add JSDoc Documentation Generation

Generate API documentation from JSDoc comments:

```json
"devDependencies": {
  "jsdoc": "^4.0.0",
  "better-docs": "^2.7.0"
},
"scripts": {
  "docs": "jsdoc -c jsdoc.json"
}
```

Create `jsdoc.json`:
```json
{
  "source": {
    "include": ["cd48.js"],
    "includePattern": ".js$"
  },
  "opts": {
    "destination": "./docs/api",
    "recurse": true
  },
  "plugins": ["plugins/markdown"],
  "templates": {
    "default": {
      "outputSourceFiles": true
    }
  }
}
```

## Medium Priority Recommendations

### 6. Add TypeScript Type Definitions

Even though the library is written in JavaScript, provide TypeScript definitions for better IDE support:

**cd48.d.ts:**
```typescript
export interface CD48Options {
  baudRate?: number;
  commandDelay?: number;
}

export interface CountData {
  counts: number[];
  overflow: number;
}

export interface RateResult {
  counts: number;
  duration: number;
  rate: number;
  channel: number;
}

export interface CoincidenceMeasurementOptions {
  duration: number;
  singlesAChannel?: number;
  singlesBChannel?: number;
  coincidenceChannel?: number;
  coincidenceWindow?: number;
}

export class CD48 {
  constructor(options?: CD48Options);
  static isSupported(): boolean;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getCounts(asString?: boolean): Promise<CountData | string>;
  clearCounts(): Promise<void>;
  getVersion(): Promise<string>;
  setTriggerLevel(voltage: number): Promise<void>;
  measureRate(channel: number, duration: number): Promise<RateResult>;
  // ... add all other public methods
}
```

### 7. Add Error Handling Examples

Create an examples/error-handling.html showing:
- Connection timeout handling
- Device disconnection recovery
- Serial port permission errors
- Graceful degradation

### 8. Add Browser Compatibility Polyfill Info

Document and possibly provide polyfills or graceful degradation for:
- Web Serial API availability check
- Modern JavaScript features (async/await, etc.)

### 9. Security Enhancements

#### Content Security Policy
Add CSP headers for the web interface:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

#### Subresource Integrity
If loading external resources, add SRI hashes.

### 10. Performance Optimizations

**For cd48.js:**
- Consider adding request queuing to prevent command overlap
- Add connection pooling if multiple instances are needed
- Implement caching for device settings queries

**For index.html:**
- Minify CSS and JavaScript for production
- Consider lazy loading for the web interface
- Add service worker for offline capability

### 11. Add Package Publishing Setup

Prepare for npm publishing:

```json
{
  "name": "jscd48",
  "version": "1.0.0",
  "description": "JavaScript interface for the CD48 Coincidence Counter",
  "main": "cd48.js",
  "types": "cd48.d.ts",
  "files": [
    "cd48.js",
    "cd48.d.ts",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### 12. Add Release Automation

Create `.github/workflows/release.yml`:
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
```

## Low Priority / Nice to Have

### 13. Add More Examples

Create additional example files:
- `examples/continuous-monitoring.html` - Long-duration monitoring
- `examples/multi-channel-display.html` - Visualize all channels
- `examples/data-export.html` - Export data to CSV/JSON
- `examples/graphing.html` - Real-time count rate graphs using Chart.js

### 14. Add Changelog

Create `CHANGELOG.md` following Keep a Changelog format:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.0] - 2024-XX-XX
### Added
- Initial release
- Web Serial API interface
- Full device control capabilities
```

### 15. Add Issue Templates

Create `.github/ISSUE_TEMPLATE/`:
- `bug_report.md`
- `feature_request.md`
- `question.md`

### 16. Add Pull Request Template

Create `.github/pull_request_template.md`:
```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### 17. Add Code of Conduct

Create `CODE_OF_CONDUCT.md` using Contributor Covenant.

### 18. Accessibility Improvements

For the web interface:
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Add focus indicators
- Test with screen readers
- Check color contrast ratios (WCAG AA compliance)

### 19. Add Internationalization (i18n)

Support for multiple languages in the web interface:
- English (default)
- Consider adding structure for translations

### 20. Add Demo Mode

Create a demo mode that simulates the device without requiring hardware:
- Mock serial responses
- Generate realistic count data
- Allow users to try the interface without CD48 hardware

## Summary of Immediate Actions

To get started quickly, implement these in order:

1. **Create `.gitignore`** - Prevent committing unwanted files
2. **Add ESLint and Prettier** - Enforce code quality
3. **Set up basic tests** - Use Vitest for testing
4. **Add CI workflow** - Automate testing on PRs
5. **Create CONTRIBUTING.md** - Guide new contributors
6. **Add TypeScript definitions** - Improve developer experience
7. **Publish to npm** - Make the library easily installable

## Resources

- [Web Serial API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Vitest Documentation](https://vitest.dev/)
- [ESLint Getting Started](https://eslint.org/docs/user-guide/getting-started)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
