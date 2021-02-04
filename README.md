# core &nbsp; ![Dev Build](https://github.com/EventiGroup/eventi/workflows/Build/badge.svg) &nbsp;[![Nx](https://img.shields.io/badge/Maintained%20with-Nx-cc00ff.svg)](https://nx.dev/)

Live-streaming & VOD platform for the performance arts.

# Installation

Basic architecture map of the application looks like this:

![StageUp](https://ftp.cass.si/h48o9h9km.png)

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

To make life easier we'll be running the databases inside docker containers, first install Docker Desktop from here: <https://www.docker.com/products/docker-desktop>  
To pull in the databases docker images use these commands:

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

Currently we just have just two applications - a frontend & a backend, but in the future this will be expanded to adding a task runner, notifications fan-out, recommendations engine etc, all of which will be sharing the interfaces + other shared code.

# Angular Commands within NX

In order to generate components under nx, instead of using the usual 
```sh
ng g n component-name
```
You will need to use:

```sh
npx nx g @nrwl/angular:component performances --project=frontend --skip-import
```

## Project Layout

```sh
  apps               # where all the apps live
    frontend         # the eventi frontend
    backend          # the eventi api
    api-tests        # integration tests
        
  libs               # where all shared code live
    interfaces       # typescript interfaces
      
  deploys            # info pertaining to deployment
    k8s              # kubernetes files (unused for now)
    docker           # docker-compose (dev, prod)
    nginx.conf       # nginx config for frontend server
      
  tools              # non-source code stuff
      
  .github            # github actions
  .vscode            # editor settings
  .prettierrc        # code formatting config
  .xo-config.json    # linter config
  nx.json            # workspace config
  package.json       # where _all_ packages are listed
  tsconfig.base.json # base ts config
  workspace.json     # where all apps, libs are defined
```

## Backend
Create a `.env` file in the root of `apps/backend/`, this will store our secret variables - please never share these with anyone - it has been added to the `.gitignore` so you don't need to worry about accidentally committing it.

```
PRIVATE_KEY="SOME_PASSWORD"
EMAIL_ADDRESS="SOME_EMAIL"
PG_USER="POSTGRES_USER"
PG_PASS="mysecretpassword"
NODE_ENV="development"
```

* `PRIVATE_KEY`: Used for hashing/salting of passwords
* `EMAIL_ADDRESS`: Used for the sender when sending e-mails via SendGrid
* `PG_USER`: Your postgres user account
* `NODE_ENV`: Used to define the environment in which the backend is running; can be `production`, `testing` or `development`

### MUX

We'll also need some private data from MUX, so now you'll need to sign up on there: <https://dashboard.mux.com/signup?type=video>  
Once you're signed up go to <https://dashboard.mux.com/settings/access-tokens>

Click _'Generate new token'_ on the right.  
Click _'Full access'_ on MUX Video for permissions & then click _'Generate token'_.

Add the following to your `.env` file by copy & pasting the values:

```
MUX_ACCESS_TOKEN="Access Token ID"
MUX_SECRET_KEY="Secret Key"
LOCALTUNNEL_URL="eventi-YOUR_NAME"
```

* `LOCALTUNNEL_URL`: When testing locally we want to be able to recieve webhooks from MUX, instead of port forwarding our router we'll use HTTP tunneling via [localtunnel](https://localtunnel.me/) to receive them.

We'll also need to add a new webhook, go to: <https://dashboard.mux.com/settings/webhooks>

Click _'Create new webhook'_.  
For the _'URL to notify'_ add `https://eventi-YOUR_NAME.loca.lt/mux/hooks`.  
And then click _'Create webhook'_.

There should be a row with your webhook, click _'Show Signing Secret'_ & paste it into your `.env`.

```
MUX_HOOK_SIGNATURE="MY_SIGNING_SECRET"
```

# Running

All packages that are used throughout all apps & libs are defined within a single `package.json`, for purposes of having consistent versioning across all projects.  
Run `npm install` in the project root to install all required dependencies.

Production builds perform tree-shaking optimization to remove unused libraries, so ensure you use ES6 import syntax.


| Context     | frontend                                                                                                                          | backend                                                                                                            | api-tests                                                                        |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| development | **Local running**, Faster re-building for development purposes<br>`npm run frontend`                                              | **Local running**, for development purposes<br>`npm run backend`                                                   | **Local running**, in watch mode for development purposes<br>`npm run api-tests` |
| testing     |                                                                                                                                   | **Local running**, for api-tests to run against, switches to `test` PG database<br>`npm run backend:testing`       |                                                                                  |
| staging     | **Live environment**, Staging build for live testing / demos<br>`npm run frontend:staging`<br>`npm run build:frontend:production` | **Live environment**, for api-tests to run against<br>`npm run backend:staging`<br>`npm run build:backend:staging` |                                                                                  |
| production  | **Live environment**, Production build<br>`npm run frontend:production`<br>`npm run build:frontend:production`                    | **Live environment**, production build<br>`npm run backend:production`<br>`npm run build:backend:production`       | Running live against staging<br>`npm run build:api-tests`                        |


<br />

* __Redis__: Start from Docker Desktop
* __PostgreSQL__: Start from Docker Desktop
* __api-tests__
  - For developing a single test use: `npm run api-tests`
  - This will first run all tests & then bring up a menu called `Watch Useage`, press `p` to filter by filename regex
  - Enter the filename of your test, e.g. `onboarding.story.ts` & press enter
  - Now you can develop the test & it will auto-re-run every time a change is made & saved

## Secrets

These are private values that should never be shared with anyone.
### apps/backend/.env
```d
PRIVATE_KEY="somerandomprivatekey"

POSTGRES_HOST="localhost"
POSTGRES_USER="postgres"
POSTGRES_PASS="mysecretpassword"

REDIS_HOST="localhost"

MUX_ACCESS_TOKEN="muxaccesstoken"
MUX_SECRET_KEY="muxsecretkey"
MUX_HOOK_SIGNATURE="muxhooksignature"

SENDGRID_USERNAME="sendgridusername"
SENDGRID_API_KEY="sendgridapikey"

AWS_S3_ACCESS_KEY_ID="awss3accesskeyid"
AWS_S3_ACCESS_SECRET_KEY="awss3secretkey"
AWS_S3_BUCKET_NAME="awss3bucketname"
AWS_S3_URL="awss3bucketurl"

# development only
LOCALTUNNEL_URL="localtunnelurl"
USE_MEMORYSTORE="true/false"
```

# Deployment - [Miro](https://miro.com/app/board/o9J_lZ6kqD4=/?moveToWidget=3074457353528169240&cot=14)

At the end of every sprint a release will be deployed, going through a number of checks in the staging area & then onto production.  
To be able to create a release first:
* Create a new token: <https://github.com/settings/tokens>
* Add a `.env` into the root directory
* Add value called `GITHUB_TOKEN=XXXX`

## Triggering a release

* All code merged into dev ready for release
* Create release tag using: `npm run release`
* Review release PR on GitHub that will be put into master
* Trigger release: `npm run deploy`, which will:
  - Build all projects source & compile Docker images
  - Push images to AWS Elastic Container Registry
  - Deploy to AWS EC2 instance staging env.
  - Integration tests against live staging env.
* Finally, `npm run deploy:production`

To build all projects & compile the docker images, run:

```shell
npm run deploy:staging # or :production
```

<br/>

# Useful Tools

* __VSCode__: <https://code.visualstudio.com/>
* __Postman__: <https://www.postman.com/downloads/>
* __DB Client__: <https://tableplus.com/>
* __JSONView__: <https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en>
