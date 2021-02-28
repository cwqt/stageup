# Deployment - [Miro](https://miro.com/app/board/o9J_lZ6kqD4=/?moveToWidget=3074457353528169240&cot=14)

At the end of every sprint a release will be deployed, going through a number of checks in the staging area & then onto production.  
To be able to create a release first:
* Create a new token: <https://github.com/settings/tokens>
* Add a `.env` into the root directory
* Add value called `GITHUB_TOKEN=XXXX`

## Triggering a release

* All code merged into dev ready for release (`commit-build-test.yml`)
* Prepare release via: `npm run release`, which will:
  - Switch to `dev` branch
  - Create a release PR on GitHub via _shipjs_ (`shipjs-prepare.yml`)
    * Automated actions on branch `release-*` (`release-build.yml`)
      - Build all projects source & compile Docker images
      - Push images to AWS Elastic Container Registry
      - Deploy to staging AWS EC2 instance
      - Integration tests against staging environment
* Squash-merge release PR squash-merged into master
  - Automated actions on branch `master` (`release-deploy.yml`)
    * Deploy created images to production infrastructure
