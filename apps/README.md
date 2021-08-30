# **Installation**

This README will walk you through installing some key software we use:

**Homebrew**: A software package management system that simplifies the installation of software on macOS

**Git**: A version control system to track file changes.

**Node** & **npm**: A JavaScript runtime environment (Node) & Javascript software package manager (npm).

**Docker**: A software platform for creating lightweight virtual machines that each run in their own sandbox environment on top of a host's operating system.

**PostgreSQL** & **Redis**: A relational database management system (PostgreSQL), and an in-memory data structure store (Redis). We run these both inside of Docker containers.

**PGAdmin**: A GUI database management tool for PostgreSQL.

**Nx**: An 'Extensible Dev Tools for Monorepos' that allows for versioning management and code sharing between our front-end and back-end. Currently we just have three applications - a frontend, backend & queue, but in the future this will be expanded to include other applications (i.e. recommendations, notifications etc). Using Nx, all of these will be able to share code (i.e. interfaces).

**localtunnel**: An application which allows you to easily share a web service on your local development machine without messing with DNS and firewall settings. localtunnel can be used to create a unique publicly accessible url on your local machine that will proxy all requests to your locally running webserver. We use this to receive webhooks from services like MUX and Stripe.

## **Homebrew (MacOS)**

To install Homebrew, run:

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Then, check if it works `brew -v`. It should give something like: `Homebrew 2.5.11`. Then run `brew update`.

```
brew -v       # Homebrew 2.7.5
brew update
```

## **Git**

To install Git, run:

```xml
brew install git 
git version #2.32.0 
```

## **Node & NPM**

To install Node & NPM, run:

```
brew install node   # install via https://nodejs.org/en/download/ on windows
node -v             # v15.5.0
npm -v              # 7.3.0`
```

## **Docker, PostgreSQL & Redis**

First install Docker Desktop from here: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) 

Then, to pull in the databases Docker images use these commands:

```
docker run --name su-redis -p 6379:6379 -d redis:6.0.12
docker run --name su-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:11
```

If you then check in the Docker Desktop app, the containers, "su-redis" and "su-postgres" should now be running. 

## PGAdmin

To install PGAdmin, go to [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/), select your OS, choose a version,  e.g. *'pgAdmin 4 v5.6'*, down the .dmg file, and then install it.

Open PGAdmin and create a new server. A modal should appear. In the *'General'* tab, give the server a name. Next, in the *'Connection'* tab you'll have to add a few values:

1. Write 'localhost' under *'Host name/address'.* 
2. Fill in the 'Port' number with the port number of the 'su-postgres' container running in Docker.
3. Fill in the 'Password', which you can find by going to the Docker GUI, clicking on the 'su-postgres' container, navigating to the 'inspect' tab, and copying the *'POSTGRES_PASSWORD'* value.

Last, click *'Save'*. You should now see the 'su-postgres' server in the left document tree on the PGAdmin dashboard.

## **Nx**

To install NX, run:

```
npm install -g nx   # 11.1.5
```

## Localtunnel

To install Localtunnel, run:

```
npm install -g localtunnel # 7.20.3
```