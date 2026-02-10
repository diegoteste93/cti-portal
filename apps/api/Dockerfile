FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm install --workspace=apps/api --workspace=packages/shared
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY tsconfig.base.json .
RUN npm run build -w packages/shared && npm run build -w apps/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/package.json
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/node_modules node_modules
RUN rm -rf node_modules/@cti/shared && ln -s ../../packages/shared node_modules/@cti/shared
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/
COPY apps/api/entrypoint.sh apps/api/
RUN chmod +x apps/api/entrypoint.sh
EXPOSE 4000
CMD ["sh", "apps/api/entrypoint.sh"]
