<p align="center">
  <img src="https://user-images.githubusercontent.com/61694629/119231515-31434200-bb19-11eb-8aec-3f1927f3f183.jpg" width="350" >
</p>

# core &nbsp; [![Nx](https://img.shields.io/badge/Maintained%20with-Nx-cc00ff.svg)](https://nx.dev/) &nbsp;[![Staging](https://github.com/StageUp/core/actions/workflows/2-deploy-staging.yml/badge.svg)](https://github.com/StageUp/core/actions/workflows/2-deploy-staging.yml) 

**StageUp** is a virtual events platform for performing arts.

## Prerequisites

Refer to [README.md](https://github.com/StageUp/core/blob/dev/apps/README.md) for installing Git, Node, NPM, Docker, PostgreSQL, Redis & NX.

Then, if you haven't already, you need to pull the project from GitHub to your local machine.

Before doing this, set up an SSH key for GitHub by following GitHub's "Connect with SSH" guide: [https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/about-ssh](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/about-ssh) 

Then, pull this project onto your machine by typing the following commands into a terminal opened in an empty directory:

```
git init
git remote add origin [git@github.com](mailto:git@github.com):StageUp/core.git
git pull origin dev
```

## Installation

Once you've completed the prereuisites above, for each application, review the setup instructions in each of these files:

- **API** (`apps/backend`): [README.md](apps/backend/README.md)
- **Frontend** (`apps/frontend`): [README.md](apps/frontend/README.md)
- **Tests** (`apps/api-tests`): [README.md](apps/api-tests/README.md)
- **Terraform** (`terraform`): [README.md](terraform/README.md)

For additional documentation on some of these and other topics, see our [Notion Software Wiki](https://www.notion.so/Software-Wiki-1b9f997a4d7942b49de9036eeb3f0f41).
## Running `npm run start`

All packages that are used throughout all apps & libs are defined within a single `package.json`, for purposes of having consistent versioning across all projects. Run `npm install --force` in the project root to install all required dependencies. Production builds perform tree-shaking optimization to remove unused libraries, so ensure you always use ES6 import syntax.

- Start **Redis** from Docker Desktop
- Start **PostgreSQL** from Docker Desktop
- On a terminal, run `npm run start`, and start the backend
- With the backend running, run the seeder by visiting the route: <http://localhost:3000/utils/seed> in a web browser (or sending it a `GET` request)
- On another terminal, run `npm run start`, and start the frontend

- **Redis**: Start from Docker Desktop
- **PostgreSQL**: Start from Docker Desktop
- **api-tests**
  - Create a new database using TablePlus called `testing` in Postgres
  - Ensure the backend is running in test mode via `npm run backend:testing`
  - For developing a single test use: `npm run api-tests`
  - This will first run all tests & then bring up a menu called `Watch Useage`, press `p` to filter by filename regex
  - Enter the filename of your test, e.g. `onboarding.story.ts` & press enter
  - Now you can develop the test & it will auto-re-run every time a change is made & saved

## **Running `api-tests`**

- Create a new database using PGAdmin called `testing` in Postgres
- Ensure the backend is running in test mode via `npm run backend:testing`
- For developing a single test use: `npm run api-tests`
- This will first run all tests & then bring up a menu called `Watch Useage`, press `p` to filter by filename regex
- Enter the filename of your test, e.g. `onboarding.story.ts` & press enter
- Now you can develop the test & it will auto-re-run every time a change is made & saved

## **Project Layout**

  `apps
    frontend           # the stageup frontend
      nginx.conf       # nginx config for frontend server
      src.app          # front-end routes, components & services
      src.assets       # media
      src.i18n         # internationalisation files
      src.styles       # global styles & Tailwind imports
    backend            # the stageup backend
      src.modules      # various sections of the backend 
      src.i18n         # internationalisation files
      seeder           # database seeder
    api-tests          # integration tests
    reverse-proxy      # nginx reverse proxy for blog/wordpress/prod app

  libs                 # where all shared code lives
    interfaces         # shared typescript interfaces
    ui-lib             # frontend generic angular component library
    shared
      api              # shared backend services utilities
        data-client    # utils for interacting with data sources
        entities       # typeorm schema
        event-bus      # event types & contracts
      helpers          # utility functions for backend & frontend

  terraform            # IaC automated deployment
    modules            # Terraform Modules, backend, redis etc.
    core               # non-ephemeral infrastructure
    
  tools                # non-source code stuff
    generate-xlf       # XLF translation script 
    generate-uml.ts    # creates a plant-uml diagram of models

  .github              # github actions
  .vscode              # editor settings
  
  nx.json              # nx workspace config
  package.json         # where _all_ packages are listed
  tsconfig.base.json   # base ts config
  workspace.json       # where all apps/libs are defined
  docker-compose.yml   # local stack deployment
  ship.config.js       # ship.js automated versioning & release config
  
  .env                 # .env for github tokens (deployment only)
  .env.example         # example .env
  .env.development     # also .env.staging, .testing & .production`

## **i18n & a11y**

- Country codes: ISO-3166-Alpha2 [iso-3166-1](https://www.npmjs.com/package/iso-3166-1)
- Language codes: ISO 639-1 [iso-939-1](https://www.npmjs.com/package/iso-639-1)
- Currency codes: ISO-4217
- Phone Numbers E.164 [formatInternational](https://www.npmjs.com/package/libphonenumber-js)
- Timestamps: UNIX relative to UTC
- Stripe: PaymentIntents & PaymentMethods
- [https://www.npmjs.com/package/i18n-iso-countries](https://www.npmjs.com/package/i18n-iso-countries)

## **Useful Tools**

- **VSCode**: A fantastic IDE. Available at: [https://code.visualstudio.com/](https://code.visualstudio.com/).
- **Postman**: An API platform for building and using APIs. Available at: [https://www.postman.com/downloads/](https://www.postman.com/downloads/).
- **JSONView**: A Chrome extension for app understanding complex structure of JSON from web source pages and apis. Available at: [https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en](https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en).
**TablePlus**: This is a simpler GUI than PGAdmin that you may prefer to use for interacting with PostgreSQL. Available at: [https://tableplus.com/](https://tableplus.com/).
## **Useful VSCode Extensions**

**Error Lens**: Display error messages inline with the related code https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens
**Git lens**: View pull requests associated with code inline and more https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens
**Angular Language Service**: Angular command autocompletion https://marketplace.visualstudio.com/items?itemName=Angular.ng-template
**vscode-angular-html**: Angular syntax highlighting/ formatting https://marketplace.visualstudio.com/items?itemName=ghaschel.vscode-angular-html
**Bracket Pair Colorizer**: Highlights functions/ blocks to allow you to visually see where they start/end https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer
**Tailwind CSS Intellisense**: Autocompletion for tailwind https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss

## **Troubleshooting**

### **Env Setup**

Below are some common errors we've seen devs experience when setting up their envs:

- Sometimes trailing spaces in env files will cause them not to load properly.
- if you copy & paste keyto and from Slack, Slack will replace quotation mark characters, so check that you're using the right type of quotation marks:  "
### **VS CODE**

- In VS Code, when switching branches you often have to restart the TS server or errors will appear when old files cannot be found. To restart the TS server, [use this guide](https://stackoverflow.com/questions/64454845/where-is-vscodes-restart-ts-server).