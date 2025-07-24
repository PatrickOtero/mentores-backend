FROM node:19-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./
COPY . .

RUN npm install
RUN npm rebuild bcrypt
RUN npx prisma generate 
RUN npm run build

FROM node:19-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
