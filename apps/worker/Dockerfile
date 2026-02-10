FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/worker/package.json apps/worker/
RUN npm install --workspace=apps/worker --workspace=packages/shared
COPY packages/shared packages/shared
COPY apps/worker apps/worker
COPY tsconfig.base.json .
RUN npm run build -w packages/shared && npm run build -w apps/worker

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/package.json
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/node_modules node_modules
RUN rm -rf node_modules/@cti/shared && ln -s ../../packages/shared node_modules/@cti/shared
COPY --from=builder /app/apps/worker/dist apps/worker/dist
COPY --from=builder /app/apps/worker/package.json apps/worker/
CMD ["node", "apps/worker/dist/main.js"]
