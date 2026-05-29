#!/bin/bash

CONTAINER_NAME="3f1b2cef743d8ca9d460455e07e44c301ace89d7292ad3bc96f545b2005eef8a"
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="${BACKUP_DIR}/neo4j_backup_${DATE}.dump"

mkdir -p ${BACKUP_DIR}
echo "Starting Neo4j backup..."

# In Neo4j 5, the database must be stopped to dump it, or you can use the built-in backup tools if enterprise.
# For standard docker dump, usually we dump the database into a file inside the container:
docker exec -t ${CONTAINER_NAME} neo4j-admin database dump neo4j --to-path=/var/lib/neo4j/data/dumps

# Copy it out to your host machine
docker cp ${CONTAINER_NAME}:/var/lib/neo4j/data/dumps/neo4j.dump ${DUMP_FILE}

if [ $? -eq 0 ]; then
  echo "Backup successful! Saved to ${DUMP_FILE}"
  echo "You can upload this .dump file directly to Neo4j AuraDB via the Aura Console."
else
  echo "Backup failed!"
  exit 1
fi
