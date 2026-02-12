FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/web apps/web

ARG VITE_GATEWAY_BASE_URL=
ARG VITE_DEV_TOKEN=dev-token-u1
ENV VITE_GATEWAY_BASE_URL=${VITE_GATEWAY_BASE_URL}
ENV VITE_DEV_TOKEN=${VITE_DEV_TOKEN}

RUN npm run build -w web

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
