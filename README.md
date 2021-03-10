# core &nbsp; ![Dev Build](https://github.com/StageUp/core/workflows/Build%20&%20Test/badge.svg) &nbsp;[![Nx](https://img.shields.io/badge/Maintained%20with-Nx-cc00ff.svg)](https://nx.dev/)

Live-streaming & VoD platform for the performance arts.

![StageUp](https://ftp.cass.si/tb81=00i4.png)

## Installation

Refer to [README.md](apps/README.md) for installing Node, Docker & the various databases before following the individual application setups.

* __API__ (`apps/backend`): [README.md](apps/backend/README.md) for setup instructions.
* __Frontend__ (`apps/frontend`): [README.md](apps/frontend/README.md) for setup instructions.
* __Queue__ (`apps/runner`): [README.md](apps/runner/README.md) for setup instructions.
* __Tests__ (`apps/api-tests`): [README.md](apps/api-tests/README.md) for setup instructions.

## Running

All packages that are used throughout all apps & libs are defined within a single `package.json`, for purposes of having consistent versioning across all projects.  
Run `npm install` in the project root to install all required dependencies.

Production builds perform tree-shaking optimization to remove unused libraries, so ensure you use ES6 import syntax.


| Context   | Development                                                                          | Testing                                                                      | Staging                                                                                                                               | Production                                                                                   |
|-----------|--------------------------------------------------------------------------------------|------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| frontend  | **Local running**, Faster re-building for development purposes<br>`npm run frontend` |                                                                              | **Live environment**, Staging build for live testing / demos<br>`npm run frontend:staging`<br><br>`npm run build:frontend:production` | **Live environment**<br>`npm run frontend:production`<br>`npm run build:frontend:production` |
| backend   | **Local running**, for development purposes<br>`npm run backend`                     | **Local running**, for api-tests to run against<br>`npm run backend:testing` | **Live environment**, for api-tests to run against<br>`npm run backend:staging`<br>`npm run build:backend:staging`                    | **Live environment**<br>`npm run backend:production`<br>`npm run build:backend:production`   |
| runner    | **Local running**, for development purposes<br>`npm run runner`                      |                                                                              | **Live environment**, for api-tests to run against<br>`npm run runner:staging`<br>`npm run build:runner:staging`                      | **Live environment**<br>`npm run runner:production`<br>`npm run build:runner:production`     |
| api-tests | **Local running**, in watch mode for development purposes<br>`npm run api-tests`     |                                                                              |                                                                                                                                       | Running live against staging<br>`npm run build:api-tests`                                    |
* __Redis__: Start from Docker Desktop
* __PostgreSQL__: Start from Docker Desktop
* __api-tests__
  - Create a new database using TablePlus called `testing` in Postgres
  - Ensure the backend is running in test mode via `npm run backend:testing`
  - For developing a single test use: `npm run api-tests`
  - This will first run all tests & then bring up a menu called `Watch Useage`, press `p` to filter by filename regex
  - Enter the filename of your test, e.g. `onboarding.story.ts` & press enter
  - Now you can develop the test & it will auto-re-run every time a change is made & saved

## Project Layout

```sh
  apps
    frontend           # the stageup frontend
      nginx.conf       # nginx config for frontend server
    backend            # the stageup backend
    runner             # distributed job queue
    api-tests          # integration tests
          
  libs                 # where all shared code live
    interfaces         # typescript interfaces
    ui-lib             # frontend generic angular component library
    shared
      api              # shared backend services utilities
        providers      # utils for interacting with data sources
      helpers          # utility functions for backend & frontend
        
  deploy               # info pertaining to deployment
    k8s                # kubernetes files (unused for now)
        
  tools                # non-source code stuff
    generate-uml.ts    # creates a plant-uml diagram of models
        
  .github              # github actions
  .vscode              # editor settings
  nx.json              # nx workspace config
  ship.config.js       # ship.js release tool config
  package.json         # where _all_ packages are listed
  tsconfig.base.json   # base ts config
  workspace.json       # where all apps/libs are defined
  docker-compose.yml   # local stack deployment
  .env                 # .env for github tokens (deployment only)
  .env.example         # example .env
  .env.development     # also .env.staging, .testing & .production
```

## Useful Tools

* __VSCode__: <https://code.visualstudio.com/>
* __Postman__: <https://www.postman.com/downloads/>
* __DB Client__: <https://tableplus.com/>
* __JSONView__: <https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en>
