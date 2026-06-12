/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@maintflow/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    '^@/(.*)$': '<rootDir>/$1',
    // The shared package uses NodeNext '.js' specifiers in its TS source; strip
    // them so ts-jest resolves the actual '.ts' files.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
