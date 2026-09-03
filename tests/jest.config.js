const path = require('path');

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  coverageProvider: 'v8',
  rootDir: path.resolve(__dirname, '..'),
  roots: [
    '<rootDir>/tests'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/modules/**/*.ts',
    '<rootDir>/src/scripts/index.ts',
    '!**/*.test.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: [
    'html',
    'text',
    'lcov'
  ],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }
    ]
  }
};

module.exports = config;
