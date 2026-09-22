# syntax=docker/dockerfile:1
# Dev (`task run`): docker-compose.dev.yml bind-mounts host ./console (node_modules included).
# This file is the prod image only (ENV=secure / docker-compose.yml).
FROM node:22-alpine AS deps
WORKDIR /app
ARG VITE_API_URL=/nfx-storages
ARG VITE_IDENTITY_API_URL=/nfx-identity
ARG VITE_SERVER_HOST=
ARG VITE_API_BASE_URL=/nfx-storages/admin/v3
ARG VITE_S3_ENDPOINT=http://192.168.1.64:10112
ARG VITE_BASE=/console/nfx-storages/
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_IDENTITY_API_URL=${VITE_IDENTITY_API_URL}
ENV VITE_SERVER_HOST=${VITE_SERVER_HOST}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_S3_ENDPOINT=${VITE_S3_ENDPOINT}
ENV VITE_BASE=${VITE_BASE}
COPY package.json package-lock.json ./
RUN npm install
COPY . .

FROM deps AS builder
ENV DOCKER_BUILD=1
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html/console/nfx-storages
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
