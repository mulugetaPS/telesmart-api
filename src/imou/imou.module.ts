import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ImouApiHelper } from './helpers/imou-api.helper';
import { ImouAdminService } from './services/imou-admin.service';
import { ImouSubAccountService } from './services/imou-sub-account.service';
import { ImouDeviceService } from './services/imou-device.service';

import { ImouDeviceController } from './controllers/imou-device.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ImouDeviceController],
  providers: [
    ImouApiHelper,
    ImouAdminService,
    ImouSubAccountService,
    ImouDeviceService,
  ],
  exports: [ImouAdminService, ImouSubAccountService, ImouDeviceService],
})
export class ImouModule { }
