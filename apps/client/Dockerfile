FROM oven/bun:1.4.4 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_WS_SERVER_URL=ws://localhost:3000
ENV VITE_WS_SERVER_URL=$VITE_WS_SERVER_URL
RUN bun run client:build

FROM nginx:stable-alpine
COPY --from=build /app/dist/apps/client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
