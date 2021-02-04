#!/bin/bash
npm install --force
nx build backend --prod --generatePackageJson
nx build frontend --prod

docker-compose down
docker-compose build