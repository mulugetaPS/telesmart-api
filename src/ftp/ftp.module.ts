import { Module } from '@nestjs/common';
import { FtpService } from './ftp.service';
import { FtpController } from './ftp.controller';

@Module({
  controllers: [FtpController],
  providers: [FtpService],
  exports: [FtpService],
})
export class FtpModule {}
