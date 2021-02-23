# core &nbsp; ![Dev Build](https://github.com/StageUp/core/workflows/Build%20&%20Test/badge.svg) &nbsp;[![Nx](https://img.shields.io/badge/Maintained%20with-Nx-cc00ff.svg)](https://nx.dev/)

Live-streaming & VoD platform for the performance arts.

![StageUp](https://ftp.cass.si/tb81=00i4.png)


# Installation

## Homebrew (skip if Windows)
Install Homebrew if you haven't already (macOS)

```sh
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

brew -v       # Homebrew 2.7.5
brew update
```

Check if it works `brew -v`, should give something like: `Homebrew 2.5.11`.  
Then run `brew update`

## Node & npm

```sh
brew install node   # install via https://nodejs.org/en/download/ on windows
node -v             # v15.5.0
npm -v              # 7.3.0
```

## PostgreSQL & Redis

To make life easier we'll be running the databases inside Docker containers, first install Docker Desktop from here: <https://www.docker.com/products/docker-desktop>  
To pull in the databases Docker images use these commands:

```sh
docker run --name su-redis -p 6379:6379 -d redis  
docker run --name su-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:11
```

And the containers should be shown as running in Docker Desktop.

## Nx

[Nx](https://nx.dev/) is described as 'Extensible Dev Tools for Monorepos' - Nx allows for seamless code sharing & versioning management.  
To install it run:

```sh
npm install -g nx   # 11.1.5
```

Currently we just have three applications - a frontend, backend & queue, but in the future this will be expanded to adding a recommendations, notifications etc., all of which will be sharing the interfaces + other shared code.

### ng-cli commands within Nx

* __Component__: `nx g @nrwl/angular:component components/COMPONENT_NAME --project=frontend --module=app.module`
* __Service__: `nx g @nrwl/angular:service services/SERVICE_NAME --project=frontend ---module=app.module`

## Project Layout

```sh
  apps
    frontend           # the stageup frontend
    backend            # the stageup backend
      .env.example     # example .env
      .env.development # also .env.staging, .testing & .production
    runner             # distributed job queue
    api-tests          # integration tests
      .env.example     # example .env - call actual one just .env
          
  libs                 # where all shared code live
    interfaces         # typescript interfaces
    ui-lib             # frontend generic angular component library
    shared
      api              # shared backend services utilities
        providers      # utils for interacting with data sources
      helpers          # utility functions for backend & frontend
        
  deploys              # info pertaining to deployment
    k8s                # kubernetes files (unused for now)
    docker             # docker-compose (dev, prod)
    nginx.conf         # nginx config for frontend server
        
  tools                # non-source code stuff
        
  .github              # github actions
  .vscode              # editor settings
  nx.json              # nx workspace config
  ship.config.js       # ship.js release tool config
  package.json         # where _all_ packages are listed
  tsconfig.base.json   # base ts config
  workspace.json       # where all apps/libs are defined
  .env                 # .env for github tokens (deployment only)
```

## Backend
Create a `.env.development` file in the root of `apps/backend/` based off of the provided `.env.example`, this will store our secret variables - please never share these with anyone - it has been added to the `.gitignore` so you don't need to worry about accidentally committing it.

## Runner
Create a `.env.development` based off the existing `.env.example`, same as in the backend.

### MUX

We'll also need some private data from MUX, so now you'll need to sign up on there: <https://dashboard.mux.com/signup?type=video>  
Once you're signed up go to <https://dashboard.mux.com/settings/access-tokens>

Click _'Generate new token'_ on the right.  
Click _'Full access'_ on MUX Video for permissions & then click _'Generate token'_.

Add the following to your `.env.development` file by copy & pasting the values:

```
MUX_ACCESS_TOKEN="Access Token ID"
MUX_SECRET_KEY="Secret Key"
LOCALTUNNEL_URL="stageup-YOUR_NAME"
```

* `LOCALTUNNEL_URL`: When testing locally we want to be able to recieve webhooks from MUX, instead of port forwarding our router we'll use HTTP tunneling via [localtunnel](https://localtunnel.me/) to receive them.

We'll also need to add a new webhook, go to: <https://dashboard.mux.com/settings/webhooks>

Click _'Create new webhook'_.  
For the _'URL to notify'_ add `https://stageup-YOUR_NAME.loca.lt/mux/hooks`.  
And then click _'Create webhook'_.

There should be a row with your webhook, click _'Show Signing Secret'_ & paste it into your `.env.development`.

```
MUX_HOOK_SIGNATURE="MY_SIGNING_SECRET"
```

# Running

All packages that are used throughout all apps & libs are defined within a single `package.json`, for purposes of having consistent versioning across all projects.  
Run `npm install` in the project root to install all required dependencies.

Production builds perform tree-shaking optimization to remove unused libraries, so ensure you use ES6 import syntax.


| Context   | Development                                                                          | Testing                                                                      | Staging                                                                                                                                   | Production                                                                                   |
|-----------|--------------------------------------------------------------------------------------|------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| frontend  | **Local running**, Faster re-building for development purposes<br>`npm run frontend` |                                                                              | **Live environment**<br>, Staging build for live testing / demos<br><br>`npm run frontend:staging`<br>`npm run build:frontend:production` | **Live environment**<br>`npm run frontend:production`<br>`npm run build:frontend:production` |
| backend   | **Local running**<br>, for development purposes<br>`npm run backend`                 | **Local running**, for api-tests to run against<br>`npm run backend:testing` | **Live environment**<br>, for api-tests to run against<br>`npm run backend:staging`<br>`npm run build:backend:staging`                    | **Live environment**<br>`npm run backend:production`<br>`npm run build:backend:production`   |
| runner    | **Local running**<br>, for development purposes<br>`npm run runner`                  |                                                                              | **Live environment**<br>, for api-tests to run against<br>`npm run runner:staging`<br>`npm run build:runner:staging`                      | **Live environment**<br>`npm run runner:production`<br>`npm run build:runner:production`     |
| api-tests | **Local running**<br>, in watch mode for development purposes<br>`npm run api-tests` |                                                                              |                                                                                                                                           | Running live against staging<br>`npm run build:api-tests`                                    |

* __Redis__: Start from Docker Desktop
* __PostgreSQL__: Start from Docker Desktop
* __api-tests__
  - Create a new database using TablePlus called `testing`
  - Make sure backend is running in test mode via `npm run backend:testing`
  - For developing a single test use: `npm run api-tests`
  - This will first run all tests & then bring up a menu called `Watch Useage`, press `p` to filter by filename regex
  - Enter the filename of your test, e.g. `onboarding.story.ts` & press enter
  - Now you can develop the test & it will auto-re-run every time a change is made & saved

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

# Useful Tools

* __VSCode__: <https://code.visualstudio.com/>
* __Postman__: <https://www.postman.com/downloads/>
* __DB Client__: <https://tableplus.com/>
* __JSONView__: <https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en>
