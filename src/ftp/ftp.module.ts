import { Module } from '@nestjs/common';
import { FtpService } from './ftp.service';
import { FtpController } from './ftp.controller';
import { StorageTrackingService } from './storage-tracking.service';
import { FtpWatcherService } from './ftp-watcher.service';

@Module({
  controllers: [FtpController],
  providers: [FtpService, StorageTrackingService, FtpWatcherService],
  exports: [FtpService, StorageTrackingService],
})
export class FtpModule {}
