const nxPreset = require('@nrwl/jest/preset');

const config = nxPreset;
delete config.testMatch

module.exports = { ...config };