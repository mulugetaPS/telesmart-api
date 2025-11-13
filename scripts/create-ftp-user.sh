#!/bin/bash

# Script to create FTP user for camera uploads

if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

if [ $# -ne 2 ]; then
  echo "Usage: $0 <username> <password>"
  exit 1
fi

USERNAME=$1
PASSWORD=$2
FTP_ROOT="/var/ftp"
USER_DIR="$FTP_ROOT/$USERNAME"

echo "Creating FTP user: $USERNAME"

# Create system user (no shell access)
useradd -m -d "$USER_DIR" -s /usr/sbin/nologin "$USERNAME"

# Set password
echo "$USERNAME:$PASSWORD" | chpasswd

# Create user directory structure
mkdir -p "$USER_DIR"
chown "$USERNAME:$USERNAME" "$USER_DIR"
chmod 755 "$USER_DIR"

# Create subdirectories for organization
mkdir -p "$USER_DIR/videos"
chown "$USERNAME:$USERNAME" "$USER_DIR/videos"

echo "FTP user created successfully!"
echo "Username: $USERNAME"
echo "Home directory: $USER_DIR"
echo "FTP URL: ftp://YOUR_SERVER_IP"
