#!/bin/bash

# Configuration
CONTAINER_NAME="aushnexa-postgres-prod"
DB_USER="postgres"
DB_NAME="aushnexa"
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting PostgreSQL backup..."

# Run pg_dump inside the docker container
docker exec -t ${CONTAINER_NAME} pg_dump -U ${DB_USER} ${DB_NAME} -c > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
  echo "Backup successful! Saved to ${BACKUP_FILE}"
else
  echo "Backup failed!"
  exit 1
fi
