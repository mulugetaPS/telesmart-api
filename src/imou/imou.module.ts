import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { ImouApiHelper } from './helpers/imou-api.helper';
import { ImouAdminService } from './services/imou-admin.service';
import { ImouSubAccountService } from './services/imou-sub-account.service';
import { ImouDeviceService } from './services/imou-device.service';
import { ImouLiveService } from './services/imou-live.service';
import { SubAccountTokenManagerService } from './services/sub-account-token-manager.service';

import { ImouDeviceController } from './controllers/imou-device.controller';
import { ImouLiveController } from './controllers/imou-live.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ImouDeviceController, ImouLiveController],
  providers: [
    ImouApiHelper,
    ImouAdminService,
    ImouSubAccountService,
    ImouDeviceService,
    ImouLiveService,
    SubAccountTokenManagerService,
  ],
  exports: [ImouAdminService, ImouSubAccountService, ImouDeviceService, ImouLiveService],
})
export class ImouModule { }
