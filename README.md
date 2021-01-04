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
node -v             #v10.15.0
npm -v              #7.0.10
```

## PostgreSQL, Redis & InfluxDB

```shell
# make sure you install postgres version 11 !
brew install postgresql@11 

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
Create a `.env` file in the root of `backend/`, this will store our secret variables - please never share these with anyone - it has been added to the `.gitignore` so you don't need to worry about accidentally committing it.

```
PRIVATE_KEY="SOME_PASSWORD"
EMAIL_ADDRESS="SOME_EMAIL"
PG_USER="POSTGRES_USER"
PG_PASS=""
NODE_ENV="development"
```

* `PRIVATE_KEY`: Used for hashing/salting of passwords
* `EMAIL_ADDRESS`: Used for the sender when sending e-mails via SendGrid
* `PG_USER`: Your postgres user account
* `NODE_ENV`: Used to define the environment in which the backend is running; can be `production`, `testing` or `development`

### MUX

We'll also need some private data from MUX, so now you'll need to sign up on there: <https://dashboard.mux.com/signup?type=video>  
Once you're signed up go to <https://dashboard.mux.com/settings/access-tokens>

Click 'Generate new token' on the right.  
Click 'Full access' on MUX Video for permissions & then click 'Generate token'.

Add the following to your `.env` file by copy & pasting the values:

```
MUX_ACCESS_TOKEN="Access Token ID"
MUX_SECRET_KEY="Secret Key"
LOCALTUNNEL_URL="eventi-YOUR_NAME"
```

* `LOCALTUNNEL_URL`: When testing locally we want to be able to recieve webhooks from MUX, instead of port forwarding our router we'll use HTTP tunneling via [localtunnel](https://localtunnel.me/) to recieve them.

We'll also need to add a new webhook, go to: <https://dashboard.mux.com/settings/webhooks>

Click 'Create new webhook'.  
For the 'URL to notify' add `https://eventi-YOUR_NAME.loca.lt/mux/hooks`.  
And then click 'Create webhook.

There should be a row with your webhook, click 'Show Signing Secret' & paste it into your `.env`.

```
MUX_HOOK_SIGNATURE="MY_SIGNING_SECRET"
```

Once that's all done, to install libraries for the backend - assuming you're in the backend root.

```shell
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

---

# Testing

* __Backend__: `npm run test`
* __REST__: `npm run test`
  * Add `BASE_URL="http://localhost:3000"` to `.env`

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
