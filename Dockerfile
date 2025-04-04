FROM node:19-alpine AS builder

WORKDIR /user/app

COPY package.json ./

COPY prisma ./prisma/

RUN npm install

RUN npm rebuild bcrypt

RUN npx prisma generate


COPY . .

RUN npm run build

FROM node:19-alpine

COPY --from=builder /user/app/node_modules ./node_modules
COPY --from=builder /user/app/package*.json ./
COPY --from=builder /user/app/dist ./dist

EXPOSE 3000

ENV DATABASE_URL=${DATABASE_URL}
CMD ["npm","run","start:prod"]
