module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['cart-utils.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
