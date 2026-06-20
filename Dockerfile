# Drovery Admin — build the Vite SPA, serve the static bundle with nginx.
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# API base defaults to RELATIVE (/api/v1): the SPA calls its own origin and the edge proxy
# (Caddy) forwards /api + /ws to the backend — so this image works on ANY domain with no
# rebuild and needs no CORS. Override for a cross-origin API: --build-arg VITE_API_BASE_URL=...
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# nginx's default CMD serves the SPA.
