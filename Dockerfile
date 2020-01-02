FROM node:10.15

COPY . /app

WORKDIR /app

RUN npm install

EXPOSE 5000

ENTRYPOINT npm run build && npm run start
