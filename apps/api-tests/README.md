# API Tests

StageUp Core API Integration Tests using Jest.

## Setting Up

Create a `.env` file in the root of this directory & add the following:

```
BASE_URL="http://localhost:3000"
```

Once the Docker Postgres database container is set up, a new database is needed to be created for testing purposes.

This can be achieved by the command:
```
docker exec su-postgres psql -c 'create database testing;' -U postgres
```

In order to be able to use this database a `.env.local.testing` file should be
be created in the project root folder. The content of this file should be almost the same as `.env.development`, but the following changes have to be done:
```
POSTGRES_DB="testing
RATE LIMIT = 9999
```

## Running the Tests

The backend needs to run in testing mode, which means when one starts the
application with `npm run start` should choose `backend` and `testing` mode. This will ensure the test database is used.

The tests themselves can be run by starting the application with `npm run start`, then choosing the option `api-tests` and finally continuing in `development` mode (!).

Further instructions to be found in the command line tool after it starts running.