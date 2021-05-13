# `docker-compose`

```
npm run start
# select deploy, ENV
docker kill $(docker ps -q)
docker-compose down ; NODE_ENV="staging" docker-compose up --build
```
