import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  // rootDir: '/home/hw/projects/nx/typeholes/',
  moduleNameMapper: {
    '^@typeholes/tserr-arktype':
      '<rootDir>/packages/tserr-arktype/src/index.ts',
    '^@typeholes/tserr-common': '<rootDir>/packages/tserr-common/src/index.ts',
    '^@typeholes/tserr-server': '<rootDir>/packages/tserr-server/src/index.ts',
    '^@typeholes/tserr-server-old':
      '<rootDir>/packages/tserr-server-old/src/index.ts',
    '^@typeholes/tserr-ts-morph':
      '<rootDir>/packages/tserr-ts-morph/src/index.ts',
    '^@typeholes/tserr-vscode': '<rootDir>/packages/tserr-vscode/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
};
export default config;
