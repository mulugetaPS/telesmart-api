#!/bin/bash

# Migration script from vsftpd to Pure-FTPd
# This script helps migrate existing vsftpd users to Pure-FTPd with PostgreSQL

set -e

echo "=== Migration from vsftpd to Pure-FTPd ==="
echo ""
echo "This script will:"
echo "1. List existing vsftpd users (cam_user_*)"
echo "2. Show you the migration steps"
echo "3. Help backup existing data"
echo ""

# Check if running as root
if [ "$EEID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Find existing FTP users
echo "Finding existing FTP users..."
FTP_USERS=$(grep "cam_user" /etc/passwd | cut -d: -f1)

if [ -z "$FTP_USERS" ]; then
  echo "No existing FTP users found (cam_user_*)"
  echo "You can proceed with Pure-FTPd setup directly."
  exit 0
fi

echo "Found existing FTP users:"
echo "$FTP_USERS"
echo ""

# Count users
USER_COUNT=$(echo "$FTP_USERS" | wc -l)
echo "Total users: $USER_COUNT"
echo ""

# Show migration steps
echo "=== Migration Steps ==="
echo ""
echo "1. BACKUP DATA (Important!)"
echo "   sudo tar -czf /root/ftp-backup-$(date +%Y%m%d).tar.gz /var/ftp/"
echo ""
echo "2. Run Prisma migration to create FtpUser table:"
echo "   npx prisma migrate dev"
echo ""
echo "3. Your Node.js app will automatically create new FTP users in database"
echo "   when users register devices or request credentials"
echo ""
echo "4. After confirming Pure-FTPd works, you can remove old system users:"
echo "   for user in $FTP_USERS; do"
echo "     sudo userdel \$user"
echo "   done"
echo ""
echo "5. Stop and disable vsftpd:"
echo "   sudo systemctl stop vsftpd"
echo "   sudo systemctl disable vsftpd"
echo ""

# Offer to backup now
read -p "Do you want to backup FTP data now? (y/n): " BACKUP
if [ "$BACKUP" = "y" ] || [ "$BACKUP" = "Y" ]; then
  BACKUP_FILE="/root/ftp-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  echo "Creating backup: $BACKUP_FILE"
  tar -czf "$BACKUP_FILE" /var/ftp/ 2>/dev/null || true
  echo "Backup created: $BACKUP_FILE"
  ls -lh "$BACKUP_FILE"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Run: sudo ./scripts/setup-pure-ftpd.sh"
echo "2. Run: npx prisma migrate dev"
echo "3. Restart your Node.js application"
echo "4. Test FTP login with a new user"
echo "5. Once confirmed working, clean up old vsftpd users"
