FROM node:alpine

WORKDIR /usr/src/app

# recursive copy all; main.js, package.json, i18n etc.
COPY dist/apps/backend/ /usr/src/app/

EXPOSE 3000

RUN npm install pg --save --force
RUN npm install --production --force

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD ["node", "/usr/src/app/main.js"]