#!/bin/bash

# FTP Server Setup Script for Ubuntu VPS
# This script installs and configures vsftpd for camera video uploads

set -e

echo "=== FTP Server Setup for Camera Video Backup ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Update system
echo "Updating system packages..."
apt update

# Install vsftpd
echo "Installing vsftpd..."
apt install -y vsftpd

# Create FTP root directory
FTP_ROOT="/var/ftp"
echo "Creating FTP root directory at $FTP_ROOT..."
mkdir -p $FTP_ROOT
chmod 755 $FTP_ROOT

# Backup original config
echo "Backing up original vsftpd config..."
cp /etc/vsftpd.conf /etc/vsftpd.conf.backup

# Create new vsftpd configuration
echo "Configuring vsftpd..."
cat > /etc/vsftpd.conf << 'EOF'
# Basic settings
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES

# Security settings
chroot_local_user=YES
allow_writeable_chroot=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd

# Passive mode settings (adjust for your VPS)
pasv_enable=YES
pasv_min_port=40000
pasv_max_port=40100

# User isolation
user_sub_token=$USER
local_root=/var/ftp/$USER

# Performance
xferlog_std_format=YES
xferlog_file=/var/log/vsftpd.log

# Additional security
ssl_enable=NO
# To enable SSL/TLS (recommended):
# ssl_enable=YES
# rsa_cert_file=/etc/ssl/certs/vsftpd.pem
# rsa_private_key_file=/etc/ssl/private/vsftpd.key
# force_local_data_ssl=YES
# force_local_logins_ssl=YES

# Upload settings
file_open_mode=0666
local_max_rate=0
EOF

# Create vsftpd empty directory
mkdir -p /var/run/vsftpd/empty

# Enable and start vsftpd
echo "Starting vsftpd service..."
systemctl enable vsftpd
systemctl restart vsftpd

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null; then
  echo "Configuring firewall..."
  ufw allow 20/tcp
  ufw allow 21/tcp
  ufw allow 40000:40100/tcp
  echo "Firewall rules added for FTP"
fi

echo ""
echo "=== FTP Server Setup Complete ==="
echo "FTP Root: $FTP_ROOT"
echo "Service Status:"
systemctl status vsftpd --no-pager
echo ""
echo "Next steps:"
echo "1. Use the API to generate FTP credentials for each device"
echo "2. Configure cameras to upload to this FTP server"
echo "3. Videos will be stored in: $FTP_ROOT/cam_<userId>_<deviceId>/"
echo ""
echo "To create a test FTP user manually:"
echo "  sudo ./scripts/create-ftp-user.sh <username> <password>"
