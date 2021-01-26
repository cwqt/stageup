module.exports = {
  displayName: 'api-tests',
  preset: '../../jest.preset.js',
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec|story))\\.[jt]sx?$",
  testRunner: 'jest-serial-runner',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
};