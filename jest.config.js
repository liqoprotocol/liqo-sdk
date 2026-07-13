module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Resolve the canonical contracts from the sibling platform build.
    // Requires liqo-platform checked out at ../liqo-platform with
    // @liqo/contracts built (see CONTRIBUTING.md). Keeps a single source of truth.
    '^@liqo/contracts$': '<rootDir>/../liqo-platform/packages/contracts/dist/index.js',
  },
};
