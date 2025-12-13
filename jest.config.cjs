module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['cart-utils.js', 'script.js', 'scripts/check-links.mjs'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
