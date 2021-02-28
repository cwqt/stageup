FROM node:alpine

WORKDIR /usr/src/app

COPY dist/apps/runner/package.json ./
COPY dist/apps/runner/main.js /usr/src/app

EXPOSE 3001

RUN npm install --production --force

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD ["node", "/usr/src/app/main.js"]