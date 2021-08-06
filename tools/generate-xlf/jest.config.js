module.exports = {
  displayName: 'generate-xlf',
  preset: '../../jest.preset.js',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  testEnvironment: 'node',
  verbose: true,
  bail: true,
  modulePathIgnorePatterns: [],
  globals: {
    'ts-jest': { tsconfig: '<rootDir>/../tsconfig.spec.json' }
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api'
};
