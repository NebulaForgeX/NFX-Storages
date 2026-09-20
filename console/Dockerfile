# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
ARG VITE_API_URL=http://192.168.1.64/nfx-storages
ARG VITE_IDENTITY_API_URL=http://192.168.1.64/nfx-identity
ARG VITE_SERVER_HOST=http://192.168.1.64
ARG VITE_API_BASE_URL=http://192.168.1.64/nfx-storages/admin/v3
ARG VITE_S3_ENDPOINT=http://192.168.1.64:10112
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_IDENTITY_API_URL=${VITE_IDENTITY_API_URL}
ENV VITE_SERVER_HOST=${VITE_SERVER_HOST}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_S3_ENDPOINT=${VITE_S3_ENDPOINT}
COPY package.json package-lock.json ./
RUN npm install
COPY . .

FROM deps AS dev
ENV DOCKER=1
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS builder
ENV DOCKER_BUILD=1
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
