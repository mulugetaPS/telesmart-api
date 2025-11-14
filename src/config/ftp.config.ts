import { registerAs } from '@nestjs/config';

export default registerAs('ftp', () => ({
  host: process.env.FTP_HOST || 'localhost',
  port: parseInt(process.env.FTP_PORT || '21', 10),
  root: process.env.FTP_ROOT || '/var/ftp',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  passwordLength: parseInt(process.env.FTP_PASSWORD_LENGTH || '16', 10),
  userManagerScript:
    process.env.FTP_USER_MANAGER_SCRIPT || '/usr/local/bin/ftp-user-manager',
}));
