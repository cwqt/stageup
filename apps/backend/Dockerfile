FROM node:alpine

# allow installing our private repo forks
RUN apk add --update git openssh-client

WORKDIR /usr/src/app

# recursive copy all; main.js, package.json, i18n etc.
COPY dist/apps/backend/ /usr/src/app/

EXPOSE 3000

RUN npm install pg --save
RUN npm install --production

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD ["node", "/usr/src/app/main.js"]