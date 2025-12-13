module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'cart-utils.js',
    'script.js',
    'scripts/check-links.mjs',
    'scripts/check-doc-coverage.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
