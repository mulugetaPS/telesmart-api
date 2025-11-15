#!/bin/bash

# Enable FTPS (FTP over SSL/TLS) for Pure-FTPd
# This adds encryption to FTP connections for security

set -e

echo "=== Enable FTPS (FTP over SSL/TLS) ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

CERT_DIR="/etc/ssl/private"
CERT_FILE="$CERT_DIR/pure-ftpd.pem"

# Check if certificate already exists
if [ -f "$CERT_FILE" ]; then
  echo "SSL certificate already exists: $CERT_FILE"
  read -p "Do you want to regenerate it? (y/n): " REGEN
  if [ "$REGEN" != "y" ] && [ "$REGEN" != "Y" ]; then
    echo "Using existing certificate"
  else
    rm -f "$CERT_FILE"
  fi
fi

# Generate self-signed certificate if needed
if [ ! -f "$CERT_FILE" ]; then
  echo "Generating self-signed SSL certificate..."
  
  # Prompt for certificate details
  read -p "Country Code (2 letters) [US]: " COUNTRY
  COUNTRY=${COUNTRY:-US}
  
  read -p "State/Province [California]: " STATE
  STATE=${STATE:-California}
  
  read -p "City [San Francisco]: " CITY
  CITY=${CITY:-San Francisco}
  
  read -p "Organization [My Company]: " ORG
  ORG=${ORG:-My Company}
  
  read -p "Common Name (server hostname) [$(hostname)]: " CN
  CN=${CN:-$(hostname)}
  
  # Generate certificate
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "$CERT_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$CN"
  
  chmod 600 "$CERT_FILE"
  echo "SSL certificate generated: $CERT_FILE"
fi

# Configure Pure-FTPd to use TLS
echo "Configuring Pure-FTPd for TLS..."

# TLS mode: 0=disabled, 1=accept both, 2=refuse non-TLS, 3=refuse TLS
# We use 1 to allow both encrypted and non-encrypted (for compatibility)
echo "1" > /etc/pure-ftpd/conf/TLS

# Set certificate path
echo "$CERT_FILE" > /etc/pure-ftpd/conf/CertFile

# Restart Pure-FTPd
echo "Restarting Pure-FTPd..."
systemctl restart pure-ftpd-postgresql

echo ""
echo "=== FTPS Enabled Successfully ==="
echo "Certificate: $CERT_FILE"
echo "TLS Mode: Accept both encrypted and plain connections"
echo ""
echo "To test FTPS connection:"
echo "  lftp -u cam_user_1 -e 'set ftp:ssl-allow yes; set ssl:verify-certificate no; ls; quit' localhost"
echo ""
echo "Or with FileZilla:"
echo "  Protocol: FTP - File Transfer Protocol"
echo "  Encryption: Use explicit FTP over TLS if available"
echo "  Host: your-server-ip"
echo "  Port: 21"
echo ""
echo "Note: This is a self-signed certificate. For production, use a certificate from Let's Encrypt or a CA."
echo ""
echo "To force TLS (reject plain FTP):"
echo "  echo '2' | sudo tee /etc/pure-ftpd/conf/TLS"
echo "  sudo systemctl restart pure-ftpd-postgresql"
