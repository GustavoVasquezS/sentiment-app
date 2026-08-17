FROM node:20-slim AS build
WORKDIR /app
# Prisma necesita poder detectar la versión de OpenSSL del sistema para
# descargar el motor de query correcto (openssl-3.0.x en Debian bookworm) —
# sin esto cae por defecto a una variante vieja (1.1.x) que ni siquiera
# está instalada, y el cliente falla al arrancar en runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/index.js"]
