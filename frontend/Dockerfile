FROM node:22.21-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Exponemos el puerto
EXPOSE 3000