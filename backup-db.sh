#!/bin/bash

# Database backup script
DB_URL='postgresql://faceuser:root@localhost:5432/faceattendance_db'
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/faceattendance_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating database backup..."
pg_dump $DB_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Keep only last 7 backups
    ls -t $BACKUP_DIR/*.sql | tail -n +8 | xargs -r rm
    echo "Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi