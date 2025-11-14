#!/bin/bash

# FTP User Manager Script
# This script should be run with sudo privileges
# It can be called from the Node.js application via a secure API or socket

ACTION=$1
USERNAME=$2
PASSWORD=$3
FTP_ROOT="/var/ftp"

case "$ACTION" in
  create)
    if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
      echo "Usage: $0 create <username> <password>"
      exit 1
    fi

    USER_DIR="$FTP_ROOT/$USERNAME"

    # Check if user already exists
    if id "$USERNAME" &>/dev/null; then
      echo "User $USERNAME already exists, updating password"
      echo "$USERNAME:$PASSWORD" | chpasswd
      exit 0
    fi

    # Create system user with no shell access
    useradd -m -d "$USER_DIR" -s /usr/sbin/nologin "$USERNAME"

    # Set password
    echo "$USERNAME:$PASSWORD" | chpasswd

    # Create user directory structure
    mkdir -p "$USER_DIR/videos"

    # Set ownership
    chown -R "$USERNAME:$USERNAME" "$USER_DIR"

    # Set permissions
    chmod 755 "$USER_DIR"

    echo "FTP user created successfully: $USERNAME"
    ;;

  delete)
    if [ -z "$USERNAME" ]; then
      echo "Usage: $0 delete <username>"
      exit 1
    fi

    # Check if user exists
    if ! id "$USERNAME" &>/dev/null; then
      echo "User $USERNAME does not exist"
      exit 0
    fi

    # Delete user and home directory
    userdel -r "$USERNAME" 2>/dev/null || true

    echo "FTP user deleted: $USERNAME"
    ;;

  update-password)
    if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
      echo "Usage: $0 update-password <username> <password>"
      exit 1
    fi

    # Check if user exists
    if ! id "$USERNAME" &>/dev/null; then
      echo "User $USERNAME does not exist"
      exit 1
    fi

    # Update password
    echo "$USERNAME:$PASSWORD" | chpasswd

    echo "Password updated for user: $USERNAME"
    ;;

  *)
    echo "Usage: $0 {create|delete|update-password} <username> [password]"
    exit 1
    ;;
esac
