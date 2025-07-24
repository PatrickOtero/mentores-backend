FROM node:18-alpine AS builder
WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npm rebuild bcrypt
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
