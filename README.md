# eventi

![Dev Build](https://github.com/EventiGroup/eventi/workflows/Node.js%20CI/badge.svg)

# Installation
Will work for macOS (& Linux with adjustment) - not sure about Windows :/

## Homebrew
Install Homebrew if you haven't already (macOS)

```shell
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Check if it works `brew -v`, should give something like: `Homebrew 2.5.11`.  
Then run `brew update`

## Node & npm

```shell
brew install node
node -v             #v15.5.0
npm -v              #7.3.0
```

## PostgreSQL, Redis & InfluxDB

```shell
# make sure you install postgres version 11 !
brew cask install postgresql@11 

brew cask install redis
brew install influxdb
```

Some tools to install;
* __Postman__: https://www.postman.com/downloads/
* __PostgreSQL & Redis__: https://tableplus.com/
* __Chronograf__: `brew install chronograf`
* __JSONView__: https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en
* __Prettier__: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode

## Interfaces
Provides e2e typing across backend & frontend.

```shell
cd interfaces
npm install --force
tsc
```

## Backend
Assuming you're in the root directory.

```shell
cd backend
npm install --force
```

## Frontend

```
npm install -g angular
cd frontend
npm install --force
```


# Running

* __Redis__: `redis-server /usr/local/etc/redis.conf`
* __InfluxDB__: `influxd`
* __PostgreSQL__: `brew services start postgresql@11`
* __Frontend__: `npm run start`
* __Backend__: `npm run start`
  - To enable debug mode use `npm run start:dev`

---

# Testing

* __Backend__: `npm run test`
  - To enable debug mode use `npm run test:dev`
* __REST__: `npm run test`

# Deployment

```
docker create network eventi
```

Create the K8s cluster

```shell
brew install minikube
minikube start 

kubectl cluster-info
kubectl get nodes
```

# Actions

Use `act` to test GH Actions locally:

`act -j build`
