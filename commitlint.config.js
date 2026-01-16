/**
 * Commitlint configuration
 * Enforces conventional commit messages
 * Format: <type>(<scope>): <subject>
 *
 * Examples:
 * - feat: add new feature
 * - fix: resolve bug in connection
 * - docs: update README
 * - test: add unit tests
 * - ci: update GitHub Actions
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of these
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Code style (formatting, semicolons, etc)
        'refactor', // Code refactoring
        'perf', // Performance improvement
        'test', // Adding or updating tests
        'build', // Build system or dependencies
        'ci', // CI/CD changes
        'chore', // Other changes (tooling, etc)
        'revert', // Revert a previous commit
      ],
    ],
    // Subject must be lowercase
    'subject-case': [2, 'always', 'lower-case'],
    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Type must not be empty
    'type-empty': [2, 'never'],
    // Header max length
    'header-max-length': [2, 'always', 100],
    // Body max line length
    'body-max-line-length': [2, 'always', 100],
  },
};
