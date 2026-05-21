#!/bin/bash
# ComfyTag — MongoDB backup script
# Run via cron: 0 2 * * * /path/to/backup-mongo.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="comfytag"
CONTAINER_NAME="comfytag-mongodb"

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting MongoDB backup..."

docker exec $CONTAINER_NAME mongodump \
  --username admin \
  --password changeme \
  --authenticationDatabase admin \
  --db $DB_NAME \
  --out /tmp/backup_$TIMESTAMP

docker cp $CONTAINER_NAME:/tmp/backup_$TIMESTAMP \
  $BACKUP_DIR/backup_$TIMESTAMP

docker exec $CONTAINER_NAME rm -rf /tmp/backup_$TIMESTAMP

# Compress
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz \
  -C $BACKUP_DIR backup_$TIMESTAMP

rm -rf $BACKUP_DIR/backup_$TIMESTAMP

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "[$TIMESTAMP] Backup complete: backup_$TIMESTAMP.tar.gz"
