/** @type {import('ts-jest').JestConfigWithTsJest} */
import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testPathIgnorePatterns: [
    'node_modules',
    'node_modules.nosync'
  ],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '<rootDir>/packages/**/source/**/*.ts',
    '!<rootDir>/packages/common/source/mocks/**/*',
  ],
  coverageReporters: [
    'json', 'lcov', 'html', 'text', 'text-summary'
  ]
}

export default config;