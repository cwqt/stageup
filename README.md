# eventi


# Installation
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
node -v             #v10.15.0
npm -v              #7.0.10
```

## PostgreSQL, Redis & InfluxDB

```shell
brew cask install postgresql
brew cask install redis
brew install influxdb
```

Some tools to install;
* __Postman__: https://www.postman.com/downloads/
* __PostgreSQL & Redis__: https://tableplus.com/
* __Chronograf__: `brew install chronograf`
* __JSONView__: https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc?hl=en

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

## Interfaces
Provides e2e typing across backend & frontend.

```shell
cd interfaces
npm install --force
tsc
```

# Running

* __Redis__: `redis-server /usr/local/etc/redis.conf`
* __InfluxDB__: `influxd`
* __PostgreSQL__: `brew services start postgresql`
* __Frontend__: `npm run start`
* __Backend__: `npm run start`

---

# Testing

# Deployment

