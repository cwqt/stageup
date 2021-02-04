FROM node:alpine

WORKDIR /usr/src/app

COPY dist/apps/backend/package.json ./
COPY dist/apps/backend/main.js /usr/src/app

EXPOSE 3000

RUN npm install pg --save
RUN npm install --production

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait


CMD ["node", "/usr/src/app/main.js"]