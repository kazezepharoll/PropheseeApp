# PropheSee target server. Build: docker build -t prophesee-server .
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
COPY server ./server
RUN npm run build:server

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787 DATA_DIR=/data
COPY --from=build /app/dist-server/index.mjs ./index.mjs
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8787
CMD ["node", "index.mjs"]
