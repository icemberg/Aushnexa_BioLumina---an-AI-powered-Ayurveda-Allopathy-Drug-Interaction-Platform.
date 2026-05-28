#!/bin/sh
set -e

# We don't necessarily have pg_isready installed in python slim image.
# We will just run alembic and if it fails due to db connection, docker-compose restart policy will catch it,
# but adding a simple sleep is often enough since docker-compose healthchecks ensure db is ready before starting this container.
# The docker-compose.yml depends_on: condition: service_healthy already handles waiting!

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
