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
    '<rootDir>/node_modules',
    '<rootDir>/**/node_modules',
    '<rootDir>/node_modules.nosync',
    '<rootDir>/**/node_modules.nosync',
    '<rootDir>/origcli',
    '<rootDir>/client-old',
    '<rootDir>/packages/client',
    '<rootDir>/packages/server',
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
  ],
  projects: [
    {
      displayName: 'common',
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts?$': 'ts-jest',
      },
      testMatch: [
        '<rootDir>/packages/common/__tests__/**/*.test.ts',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/packages/common/distribution',
        '<rootDir>/packages/common/source/mocks'
      ],
      coveragePathIgnorePatterns: [
        '<rootDir>/packages/common/source/mocks'
      ]
    }
  ]
}

export default config;