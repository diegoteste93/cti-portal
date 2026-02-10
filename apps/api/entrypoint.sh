#!/bin/sh
set -e

echo "Running database migrations..."
npx typeorm migration:run -d apps/api/dist/database/data-source.js

echo "Running database seed..."
node apps/api/dist/database/seed.js

echo "Starting API server..."
exec node apps/api/dist/main.js
