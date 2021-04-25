module.exports = {
  buildCommand: () => null,
  monorepo: {
    mainVersionFile: 'package.json',
    packagesToBump: [],
    packagesToPublish: [],
    updateDependencies: true
  },
  afterPublish: ({ exec }) => {
    exec(`git config --global user.email "dev@cass.si"`);
    exec(`git config --global user.name "Cass"`);

    exec('git checkout master');
    exec('git merge dev');
    exec('git push origin master');
  },
  mergeStrategy: {
    toReleaseBranch: {
      next: 'master'
    }
  }
};
