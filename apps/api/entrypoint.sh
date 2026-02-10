#!/bin/sh

echo "=== CTI Portal API Starting ==="

echo "Running database migrations..."
node node_modules/typeorm/cli.js migration:run -d apps/api/dist/database/data-source.js || {
  echo "WARNING: Migration failed (may already be applied), continuing..."
}

echo "Running database seed..."
node apps/api/dist/database/seed.js || {
  echo "WARNING: Seed failed, continuing..."
}

echo "Starting API server..."
exec node apps/api/dist/main.js
