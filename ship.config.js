module.exports = {
  buildCommand: () => null,
  monorepo: {
    mainVersionFile: 'package.json',
    packagesToBump: [],
    packagesToPublish: [],
    updateDependencies: true
  },
  mergeStrategy: {
    toReleaseBranch: {
      next: 'master',
    },
  },
};
