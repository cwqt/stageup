# Installation

## Homebrew (MacOS)
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
