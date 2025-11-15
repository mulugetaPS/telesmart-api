#!/bin/bash

# Pure-FTPd with PostgreSQL Setup Script
# This script installs and configures Pure-FTPd to use PostgreSQL for authentication

set -e

echo "=== Pure-FTPd with PostgreSQL Setup ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Prompt for database credentials
read -p "PostgreSQL Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "PostgreSQL Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "PostgreSQL Database Name: " DB_NAME
if [ -z "$DB_NAME" ]; then
  echo "Database name is required"
  exit 1
fi

read -p "PostgreSQL Username: " DB_USER
if [ -z "$DB_USER" ]; then
  echo "Database username is required"
  exit 1
fi

read -sp "PostgreSQL Password: " DB_PASSWORD
echo
if [ -z "$DB_PASSWORD" ]; then
  echo "Database password is required"
  exit 1
fi

# Update system
echo "Updating system packages..."
apt update

# Stop and disable vsftpd if running
if systemctl is-active --quiet vsftpd; then
  echo "Stopping vsftpd..."
  systemctl stop vsftpd
  systemctl disable vsftpd
fi

# Install Pure-FTPd with PostgreSQL support
echo "Installing Pure-FTPd with PostgreSQL support..."
apt install -y pure-ftpd-postgresql

# Create FTP system user (all virtual users will use this UID/GID)
echo "Creating FTP system user..."
if ! id -u ftpuser > /dev/null 2>&1; then
  useradd -r -d /var/ftp -s /usr/sbin/nologin ftpuser
  echo "FTP user 'ftpuser' created"
else
  echo "FTP user 'ftpuser' already exists"
fi

# Create FTP root directory
FTP_ROOT="/var/ftp"
echo "Setting up FTP root directory at $FTP_ROOT..."
mkdir -p $FTP_ROOT
chown ftpuser:ftpuser $FTP_ROOT
chmod 755 $FTP_ROOT

# Configure Pure-FTPd PostgreSQL connection
echo "Configuring Pure-FTPd PostgreSQL connection..."
cat > /etc/pure-ftpd/db/postgresql.conf << EOF
PGSQLServer      $DB_HOST
PGSQLPort        $DB_PORT
PGSQLUser        $DB_USER
PGSQLPassword    $DB_PASSWORD
PGSQLDatabase    $DB_NAME
PGSQLCrypt       any

# Query to get password
PGSQLGetPW       SELECT password FROM "FtpUser" WHERE username='\L' AND "isActive"=true

# Query to get UID
PGSQLGetUID      SELECT uid FROM "FtpUser" WHERE username='\L' AND "isActive"=true

# Query to get GID
PGSQLGetGID      SELECT gid FROM "FtpUser" WHERE username='\L' AND "isActive"=true

# Query to get home directory
PGSQLGetDir      SELECT "homeDir" FROM "FtpUser" WHERE username='\L' AND "isActive"=true

# Optional: Query to get quota
# PGSQLGetQTAFS    SELECT "quotaSize" FROM "FtpUser" WHERE username='\L'
# PGSQLGetQTAC     SELECT "quotaFiles" FROM "FtpUser" WHERE username='\L'

# Optional: Query to get bandwidth limits
# PGSQLGetBandwidthUL  SELECT "uploadBandwidth" FROM "FtpUser" WHERE username='\L'
# PGSQLGetBandwidthDL  SELECT "downloadBandwidth" FROM "FtpUser" WHERE username='\L'
EOF

chmod 600 /etc/pure-ftpd/db/postgresql.conf

# Configure Pure-FTPd settings
echo "Configuring Pure-FTPd settings..."

# PostgreSQL authentication is enabled by default when using pure-ftpd-postgresql
# The config file is automatically read from /etc/pure-ftpd/db/postgresql.conf

# Disable anonymous login
echo "no" > /etc/pure-ftpd/conf/NoAnonymous

# Enable chroot (lock users to their home directory)
echo "yes" > /etc/pure-ftpd/conf/ChrootEveryone

# Set minimum UID (prevent system users from logging in)
echo "2000" > /etc/pure-ftpd/conf/MinUID

# Disable PAM authentication (we use PostgreSQL)
echo "no" > /etc/pure-ftpd/conf/PAMAuthentication

# Disable Unix authentication (we use PostgreSQL)
echo "no" > /etc/pure-ftpd/conf/UnixAuthentication

# Enable passive mode
echo "40000 40100" > /etc/pure-ftpd/conf/PassivePortRange

# Set umask for uploaded files
echo "133 022" > /etc/pure-ftpd/conf/Umask

# Disable FXP (File eXchange Protocol) for security
echo "no" > /etc/pure-ftpd/conf/AllowUserFXP

# Display a welcome message (optional - comment out if not needed)
# echo "Welcome to Camera FTP Server" > /etc/pure-ftpd/welcome.txt
# echo "/etc/pure-ftpd/welcome.txt" > /etc/pure-ftpd/conf/FortunesFile

# Optional: Enable TLS (recommended for production)
# echo "1" > /etc/pure-ftpd/conf/TLS

# Restart Pure-FTPd
echo "Restarting Pure-FTPd..."
systemctl restart pure-ftpd-postgresql
systemctl enable pure-ftpd-postgresql

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
  echo "Configuring firewall..."
  ufw allow 21/tcp
  ufw allow 40000:40100/tcp
  echo "Firewall rules added for FTP"
fi

echo ""
echo "=== Pure-FTPd with PostgreSQL Setup Complete ==="
echo "FTP Root: $FTP_ROOT"
echo "Virtual User: ftpuser (UID/GID: 2001)"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo ""
echo "Service Status:"
systemctl status pure-ftpd-postgresql --no-pager
echo ""
echo "Next steps:"
echo "1. Run Prisma migration to create FtpUser table:"
echo "   npx prisma migrate dev"
echo "2. Your Node.js app will now create FTP users in the database"
echo "3. No sudo scripts needed - just database operations!"
echo ""
echo "Test FTP connection:"
echo "  ftp localhost"
echo "  Username: [from database]"
echo "  Password: [from database]"
