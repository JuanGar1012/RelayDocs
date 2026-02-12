FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/gateway/package.json apps/gateway/package.json

RUN npm ci

COPY apps/gateway apps/gateway
RUN npm run build -w gateway

FROM node:20-alpine AS runtime
WORKDIR /workspace

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/gateway/package.json apps/gateway/package.json
RUN npm ci --omit=dev --workspace gateway

COPY --from=build /workspace/apps/gateway/dist apps/gateway/dist

EXPOSE 8080
CMD ["node", "apps/gateway/dist/index.js"]
