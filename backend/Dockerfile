FROM node:12.2.0

ENV PORT 3000
EXPOSE 3000

WORKDIR /app/backend

COPY package.json .

RUN npm install --prod

RUN mkdir -p ./build
RUN mkdir -p ./node_modules

COPY ./build ./build

CMD ["node","build/index.js"]