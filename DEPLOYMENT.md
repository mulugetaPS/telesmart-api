# Ubuntu VPS Deployment Guide

## Prerequisites

- Ubuntu 20.04+ VPS
- Node.js 18+ installed
- PostgreSQL installed
- Domain name (optional but recommended)

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (if not installed)
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

## Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE telesmart;
CREATE USER telesmart_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE telesmart TO telesmart_user;
\q
```

## Step 3: Clone and Setup Application

```bash
# Clone your repository
cd /var/www
sudo git clone <your-repo-url> telesmart
cd telesmart

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env
```

Update `.env`:
```env
DATABASE_URL="postgresql://telesmart_user:your_secure_password@localhost:5432/telesmart"
JWT_SECRET="generate-a-secure-random-string"
JWT_EXPIRES_IN="7d"
FTP_HOST="your-vps-ip-or-domain"
FTP_PORT=21
FTP_ROOT="/var/ftp"
ENCRYPTION_KEY="generate-another-secure-random-string"
PORT=3000
NODE_ENV="production"
```

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build application
npm run build
```

## Step 4: Setup FTP Server

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run FTP setup
sudo ./scripts/setup-ftp.sh

# Start FTP monitoring service
sudo nano /etc/systemd/system/ftp-monitor.service
```

Add this content:
```ini
[Unit]
Description=FTP Upload Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/telesmart
ExecStart=/var/www/telesmart/scripts/monitor-ftp-uploads.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start the service
sudo systemctl enable ftp-monitor
sudo systemctl start ftp-monitor
sudo systemctl status ftp-monitor
```

## Step 5: Start Application with PM2

```bash
# Start the application
pm2 start dist/main.js --name telesmart

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs telesmart
```

## Step 6: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/telesmart
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    client_max_body_size 500M;  # Allow large video uploads

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for video streaming
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/telesmart /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 7: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Step 8: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow FTP
sudo ufw allow 21/tcp
sudo ufw allow 20/tcp
sudo ufw allow 40000:40100/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Step 9: Test the Setup

```bash
# Check if API is running
curl http://localhost:3000

# Check FTP server
sudo systemctl status vsftpd

# Check application logs
pm2 logs telesmart

# Check FTP monitor logs
sudo journalctl -u ftp-monitor -f
```

## Maintenance Commands

### Update Application
```bash
cd /var/www/telesmart
git pull
npm install
npm run build
pm2 restart telesmart
```

### View Logs
```bash
# Application logs
pm2 logs telesmart

# FTP logs
sudo tail -f /var/log/vsftpd.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backup
```bash
# Backup database
pg_dump -U telesmart_user telesmart > backup_$(date +%Y%m%d).sql

# Restore database
psql -U telesmart_user telesmart < backup_20240115.sql
```

### Monitor Disk Space
```bash
# Check disk usage
df -h

# Check FTP directory size
du -sh /var/ftp/*

# Clean old videos (older than 30 days)
find /var/ftp -name "*.mp4" -mtime +30 -delete
```

## Troubleshooting

### Application won't start
```bash
pm2 logs telesmart --lines 100
# Check for database connection issues or missing environment variables
```

### FTP connection issues
```bash
# Check vsftpd status
sudo systemctl status vsftpd

# Check logs
sudo tail -f /var/log/vsftpd.log

# Test FTP locally
ftp localhost
```

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U telesmart_user -d telesmart -h localhost
```

### High disk usage
```bash
# Find large files
du -ah /var/ftp | sort -rh | head -20

# Setup automatic cleanup cron job
sudo crontab -e
# Add: 0 2 * * * find /var/ftp -name "*.mp4" -mtime +30 -delete
```

## Security Checklist

- [ ] Change default passwords
- [ ] Enable SSL/TLS for FTP (FTPS)
- [ ] Setup SSL certificate for API (HTTPS)
- [ ] Configure firewall properly
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Setup automated backups
- [ ] Monitor logs regularly
- [ ] Use strong JWT secret
- [ ] Limit FTP user permissions
- [ ] Setup fail2ban for brute force protection

## Performance Optimization

### For High Traffic

1. **Increase Node.js memory**
```bash
pm2 start dist/main.js --name telesmart --max-memory-restart 1G
```

2. **Enable Nginx caching**
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=video_cache:10m max_size=10g inactive=60m;
```

3. **Use CDN for video delivery**
- Consider CloudFlare, AWS CloudFront, or similar

4. **Database optimization**
```sql
-- Add indexes if needed
CREATE INDEX idx_videos_user_recorded ON "Video"("userId", "recordedAt" DESC);
```

## Monitoring Setup (Optional)

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Setup log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

Your application should now be running at `http://your-domain.com` or `http://your-vps-ip`!
