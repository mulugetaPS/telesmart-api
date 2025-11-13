# FTP Video Backup Setup Guide

This guide explains how to set up FTP server for camera video backups on Ubuntu VPS.

## Quick Start

### 1. Setup FTP Server on Ubuntu VPS

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run FTP setup (requires root)
sudo ./scripts/setup-ftp.sh
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and set:
# - FTP_HOST: Your VPS IP or domain
# - FTP_PORT: 21 (default)
# - FTP_ROOT: /var/ftp
# - ENCRYPTION_KEY: Generate a secure random key
```

### 3. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_video_tables
```

### 4. Start Backend API

```bash
npm run start:dev
```

## API Endpoints

### FTP Credentials Management

**Generate FTP credentials for a device:**
```bash
POST /ftp/credentials/:deviceId
```

Response:
```json
{
  "ftpUsername": "cam_1_ABC123",
  "ftpPassword": "secure_random_password",
  "ftpHost": "your-vps-ip",
  "ftpPort": 21
}
```

**Get existing FTP credentials:**
```bash
GET /ftp/credentials/:deviceId
```

### Video Management

**List videos with filters:**
```bash
GET /videos?deviceId=1&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
```

**Get single video:**
```bash
GET /videos/:id
```

**Stream video:**
```bash
GET /videos/:id/stream
```

**Get thumbnail:**
```bash
GET /videos/:id/thumbnail
```

**Delete video:**
```bash
DELETE /videos/:id
```

**Check storage quota:**
```bash
GET /videos/storage/:userId
```

Response:
```json
{
  "usedBytes": 5368709120,
  "limitBytes": 10737418240,
  "usedGB": 5.0,
  "limitGB": 10.0,
  "percentageUsed": 50.0
}
```

## Camera Configuration

Configure your cameras to upload videos via FTP:

1. Get FTP credentials from API: `POST /ftp/credentials/:deviceId`
2. Configure camera FTP settings:
   - **Server:** Your VPS IP/domain
   - **Port:** 21
   - **Username:** From API response
   - **Password:** From API response
   - **Upload Path:** `/videos/` (optional subdirectory)

## Directory Structure

Videos are organized by user and device:
```
/var/ftp/
├── cam_1_ABC123/          # User 1, Device ABC123
│   └── videos/
│       ├── 2024-01-15_10-30-00.mp4
│       └── 2024-01-15_11-00-00.mp4
├── cam_1_XYZ789/          # User 1, Device XYZ789
│   └── videos/
└── cam_2_DEF456/          # User 2, Device DEF456
    └── videos/
```

## Monitoring FTP Uploads

To automatically register uploaded videos in the database:

```bash
# Run the monitoring script
sudo ./scripts/monitor-ftp-uploads.sh
```

This script watches for new video files and calls the API to register them.

For production, create a systemd service:

```bash
sudo nano /etc/systemd/system/ftp-monitor.service
```

```ini
[Unit]
Description=FTP Upload Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/your/app
ExecStart=/path/to/your/app/scripts/monitor-ftp-uploads.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ftp-monitor
sudo systemctl start ftp-monitor
```

## Security Recommendations

### 1. Enable FTPS (FTP over SSL)

```bash
# Generate SSL certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/vsftpd.key \
  -out /etc/ssl/certs/vsftpd.pem

# Edit /etc/vsftpd.conf
sudo nano /etc/vsftpd.conf
```

Add:
```
ssl_enable=YES
rsa_cert_file=/etc/ssl/certs/vsftpd.pem
rsa_private_key_file=/etc/ssl/private/vsftpd.key
force_local_data_ssl=YES
force_local_logins_ssl=YES
```

### 2. Firewall Configuration

```bash
# Allow FTP ports
sudo ufw allow 21/tcp
sudo ufw allow 20/tcp
sudo ufw allow 40000:40100/tcp
sudo ufw enable
```

### 3. Rate Limiting

Add to `/etc/vsftpd.conf`:
```
local_max_rate=1048576  # 1MB/s per connection
max_clients=50
max_per_ip=3
```

## Storage Management

### Automatic Cleanup

Create a cron job to delete old videos:

```bash
sudo crontab -e
```

Add:
```bash
# Delete videos older than 30 days at 2 AM daily
0 2 * * * find /var/ftp -name "*.mp4" -mtime +30 -delete
```

### Monitor Disk Space

```bash
# Check FTP directory size
du -sh /var/ftp/*

# Check disk usage
df -h
```

## Troubleshooting

### FTP Connection Issues

```bash
# Check vsftpd status
sudo systemctl status vsftpd

# View logs
sudo tail -f /var/log/vsftpd.log

# Test FTP locally
ftp localhost
```

### Permission Issues

```bash
# Fix FTP root permissions
sudo chmod 755 /var/ftp
sudo chown root:root /var/ftp

# Fix user directory permissions
sudo chown -R cam_1_ABC123:cam_1_ABC123 /var/ftp/cam_1_ABC123
```

### Passive Mode Issues

If cameras can't connect in passive mode, check your VPS firewall allows ports 40000-40100.

## Performance Optimization

### For High Traffic

1. **Increase file descriptors:**
```bash
sudo nano /etc/security/limits.conf
```
Add:
```
* soft nofile 65536
* hard nofile 65536
```

2. **Optimize vsftpd:**
```bash
# Add to /etc/vsftpd.conf
tcp_wrappers=NO
use_sendfile=YES
```

3. **Use SSD storage** for `/var/ftp`

4. **Consider object storage** (S3, MinIO) for long-term storage

## Next Steps

- [ ] Set up SSL/TLS for secure FTP
- [ ] Implement video thumbnail generation (FFmpeg)
- [ ] Add webhook notifications for new uploads
- [ ] Set up automated backups
- [ ] Configure CDN for video streaming
- [ ] Add video compression/transcoding
