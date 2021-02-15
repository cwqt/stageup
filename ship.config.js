module.exports = {
  buildCommand: () => null,
  monorepo: {
    mainVersionFile: 'package.json',
    packagesToBump: [],
    packagesToPublish: [],
    updateDependencies: true // optional, default: true
  }
};
