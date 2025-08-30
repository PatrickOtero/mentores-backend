FROM node:19-alpine AS base
WORKDIR /usr/src/app
ENV CI=true

FROM base AS builder

RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npm rebuild bcrypt --build-from-source
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["npm","run","start:prod"]

FROM base AS migrator

COPY package*.json ./
RUN npm ci
COPY prisma ./prisma

RUN npx prisma --version

CMD ["npx","prisma","migrate","deploy"]
