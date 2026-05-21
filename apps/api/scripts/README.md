# ComfyTag API Scripts

## backup-mongo.sh
Backs up MongoDB to local /backups/mongodb directory.
Keeps last 7 days. Compresses each backup.

### Setup cron (Linux/Mac):
crontab -e
Add: 0 2 * * * /path/to/comfytag/apps/api/scripts/backup-mongo.sh

### Manual run:
bash apps/api/scripts/backup-mongo.sh
