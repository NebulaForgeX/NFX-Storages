# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://127.0.0.1:10130
ARG VITE_IDENTITY_API_URL=http://127.0.0.1:10166
ARG VITE_SERVER_HOST=http://127.0.0.1:10130
ARG VITE_API_BASE_URL=http://127.0.0.1:10130/nfxstorages/admin/v3
ARG VITE_S3_ENDPOINT=http://127.0.0.1:10130
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_IDENTITY_API_URL=${VITE_IDENTITY_API_URL}
ENV VITE_SERVER_HOST=${VITE_SERVER_HOST}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_S3_ENDPOINT=${VITE_S3_ENDPOINT}
COPY package.json package-lock.json* ./
COPY --from=nfx-ui . /NFX-UI
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
