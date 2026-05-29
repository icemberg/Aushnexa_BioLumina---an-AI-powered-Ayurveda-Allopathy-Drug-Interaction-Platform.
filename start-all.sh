#!/bin/sh
set -e

# Default PORT to 10000 if not set (Render default)
export PORT=${PORT:-10000}

echo "Generating Nginx config for port $PORT..."
envsubst '${PORT}' < /etc/nginx/templates/nginx.allinone.conf.template > /etc/nginx/conf.d/default.conf

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting Uvicorn backend in the background..."
# We run uvicorn on port 8000 internally.
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

echo "Starting Nginx in the foreground..."
exec nginx -g "daemon off;"
