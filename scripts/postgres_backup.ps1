$DB_USER = "aushnexa_user"
$DB_NAME = "aushnexa"
$BACKUP_DIR = ".\backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\postgres_backup_$DATE.sql"

New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
Write-Host "Starting PostgreSQL backup..."

# Note: The postgres container MUST be running for pg_dump to work.
# We use 'docker-compose exec -T' to reliably target the database without needing the exact container ID.
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME -c > $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful! Saved to $BACKUP_FILE" -ForegroundColor Green
} else {
    Write-Host "Backup failed! Is your postgres container running?" -ForegroundColor Red
    # Clean up the empty or partial file
    if (Test-Path $BACKUP_FILE) { Remove-Item $BACKUP_FILE }
}
