FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm install --workspace=apps/web --workspace=packages/shared
COPY packages/shared packages/shared
COPY apps/web apps/web
COPY tsconfig.base.json .
RUN npm run build -w packages/shared && npm run build -w apps/web

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/package.json apps/web/
COPY --from=builder /app/node_modules node_modules
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web"]
