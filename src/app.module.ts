import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UserModule } from './user/user.module';
import { DeviceModule } from './device/device.module';
import { ImouModule } from './imou/imou.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
    UserModule,
    DeviceModule,
    ImouModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
