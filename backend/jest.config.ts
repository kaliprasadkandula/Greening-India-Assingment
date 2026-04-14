import type { Config } from 'jest';

process.env.DATABASE_URL ??= 'postgresql://taskflow:taskflow@localhost:5432/taskflow';
process.env.JWT_SECRET   ??= 'test-secret-for-jest-minimum-32-chars-xx';
process.env.NODE_ENV     ??= 'test';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 30000,
};

export default config;
