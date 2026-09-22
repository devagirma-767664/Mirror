FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm --prefix backend ci --omit=dev
COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend ci

COPY backend ./backend
COPY frontend ./frontend
RUN npm --prefix frontend run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=5010

COPY --from=build --chown=node:node /app/backend ./backend
COPY --from=build --chown=node:node /app/frontend/dist ./frontend/dist

USER node
EXPOSE 5010
# A direct listener keeps the HTTP process stable on the current VPS runtime.
CMD ["node", "-e", "require('./backend/server').listen(process.env.PORT || 5010, '0.0.0.0')"]
