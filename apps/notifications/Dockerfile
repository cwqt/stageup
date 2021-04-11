FROM node:alpine

WORKDIR /usr/src/app

COPY dist/apps/notifications/package.json ./
COPY dist/apps/notifications/main.js /usr/src/app

EXPOSE 3002

RUN npm install --production --force

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD ["node", "/usr/src/app/main.js"]