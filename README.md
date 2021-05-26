<p align="center">
  <img src="https://user-images.githubusercontent.com/61694629/119231515-31434200-bb19-11eb-8aec-3f1927f3f183.jpg" width="350" >
</p>

# core &nbsp; ![Dev Build](https://github.com/StageUp/core/workflows/Build%20&%20Test/badge.svg) &nbsp;[![Nx](https://img.shields.io/badge/Maintained%20with-Nx-cc00ff.svg)](https://nx.dev/)

Live-streaming & VoD platform for the performance arts.

## Installation

Refer to [README.md](apps/README.md) for installing Node, Docker & the various databases before following the individual application setups.

For each application, review the setup instructions in each of these files:

- **API** (`apps/backend`): [README.md](apps/backend/README.md)
- **Frontend** (`apps/frontend`): [README.md](apps/frontend/README.md)
- **Queue** (`apps/runner`): [README.md](apps/runner/README.md)
- **Notifications** (`apps/notifications`) [README.md](apps/notifications/README.md)
- **Tests** (`apps/api-tests`): [README.md](apps/api-tests/README.md)

## Running `npm run start`

All packages that are used throughout all apps & libs are defined within a single `package.json`, for purposes of having consistent versioning across all projects.
Run `npm install` in the project root to install all required dependencies.

Production builds perform tree-shaking optimization to remove unused libraries, so ensure you use ES6 import syntax.

- **Redis**: Start from Docker Desktop
- **PostgreSQL**: Start from Docker Desktop
- **api-tests**
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

# i18n

- Country codes: ISO-3166-Alpha2 [iso-3166-1](https://www.npmjs.com/package/iso-3166-1)
- Language codes: ISO 639-1 [iso-939-1](https://www.npmjs.com/package/iso-639-1)
- Currency codes: ISO-4217
- Phone Numbers E.164 [formatInternational](https://www.npmjs.com/package/libphonenumber-js)
- Timestamps: UNIX relative to
- Stripe: PaymentIntents & PaymentMethods

- https://www.npmjs.com/package/i18n-iso-countries

## Useful Tools

- **VSCode**: <https://code.visualstudio.com/>
- **Postman**: <https://www.postman.com/downloads/>
- **DB Client**: <https://tableplus.com/>
- **JSONView**: <https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en>
