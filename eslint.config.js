import js from '@eslint/js';
import html from 'eslint-plugin-html';

export default [
  // Apply to JavaScript files
  {
    files: ['**/*.js'],
    ignores: ['node_modules/', 'dist/', 'docs/', 'coverage/'],
    languageOptions: {
      ecmaVersion: 2022, // Support top-level await
      sourceType: 'module',
      globals: {
        // Browser globals
        navigator: 'readonly',
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        TextDecoderStream: 'readonly',
        TextEncoderStream: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        // Node.js globals
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  // Apply to HTML files (inline scripts)
  {
    files: ['**/*.html'],
    plugins: {
      html,
    },
    ignores: ['node_modules/', 'dist/', 'docs/', 'coverage/'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Browser globals
        navigator: 'readonly',
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        TextDecoderStream: 'readonly',
        TextEncoderStream: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        CD48: 'readonly',
        Chart: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      // HTML files have event handlers that appear unused
      'no-unused-vars': 'off',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
];
