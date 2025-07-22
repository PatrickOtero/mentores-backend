# ---- STAGE 1: Build ----
FROM node:19-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build

# ---- STAGE 2: Production ----
FROM node:19-alpine AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma

RUN apk add --no-cache python3 make g++ && npm rebuild bcrypt && apk del python3 make g++

EXPOSE 3000

CMD ["npm", "run", "start:prod"]

