#!/bin/bash

# Create the system user that will own all FTP files
# This only needs to be run once during initial setup

set -e

echo "=== Creating FTP System User ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

FTP_USER="ftpuser"
FTP_UID=2001
FTP_GID=2001
FTP_ROOT="/var/ftp"

# Check if user already exists
if id -u $FTP_USER > /dev/null 2>&1; then
  echo "User '$FTP_USER' already exists"
  id $FTP_USER
  exit 0
fi

# Create group
if ! getent group $FTP_USER > /dev/null 2>&1; then
  groupadd -g $FTP_GID $FTP_USER
  echo "Group '$FTP_USER' created with GID $FTP_GID"
fi

# Create user
useradd -r -u $FTP_UID -g $FTP_GID -d $FTP_ROOT -s /usr/sbin/nologin $FTP_USER
echo "User '$FTP_USER' created with UID $FTP_UID"

# Create and set permissions on FTP root
mkdir -p $FTP_ROOT
chown $FTP_USER:$FTP_USER $FTP_ROOT
chmod 755 $FTP_ROOT

echo ""
echo "FTP system user created successfully!"
echo "User: $FTP_USER"
echo "UID: $FTP_UID"
echo "GID: $FTP_GID"
echo "Home: $FTP_ROOT"
echo ""
echo "All virtual FTP users will use this UID/GID for file ownership."
