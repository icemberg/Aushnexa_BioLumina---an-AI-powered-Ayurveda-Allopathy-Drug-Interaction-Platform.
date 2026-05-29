$PROJECT_NAME = "aushnexa"
$VOLUME_NAME = "${PROJECT_NAME}_neo4j_data"
$BACKUP_DIR = ".\backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$DUMP_FILE = "$BACKUP_DIR\neo4j_backup_$DATE.dump"

New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
Write-Host "Starting Neo4j backup..."

# Step 1: Stop the running Neo4j container. 
# (Community Edition cannot be dumped while running, and 'STOP DATABASE' is an Enterprise-only feature)
Write-Host "Stopping local Neo4j container..."
docker-compose stop neo4j

# Step 2: Run a temporary container connected to the same volume to perform the offline dump.
# We mount your local backups folder directly into the container so it saves it directly to Windows!
$ABS_BACKUP_DIR = (Resolve-Path $BACKUP_DIR).Path
Write-Host "Dumping database..."

docker run --rm -v "${VOLUME_NAME}:/data" -v "${ABS_BACKUP_DIR}:/backups" neo4j:5.26-community neo4j-admin database dump neo4j --to-path=/backups

if (Test-Path "$BACKUP_DIR\neo4j.dump") {
    # Step 3: Rename to include timestamp
    Rename-Item -Path "$BACKUP_DIR\neo4j.dump" -NewName "neo4j_backup_$DATE.dump"
    Write-Host "Backup successful! Saved to $DUMP_FILE" -ForegroundColor Green
    Write-Host "You can upload this .dump file directly to Neo4j AuraDB via the Aura Console."
} else {
    Write-Host "Backup failed during the dump process." -ForegroundColor Red
}

# Step 4: Restart the database so your app works again
Write-Host "Starting local Neo4j container back up..."
docker-compose start neo4j
