import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import ftpConfig from './config/ftp.config';
import imouConfig from './config/imou.config';
import { CacheModule } from './cache/cache.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { VideoModule } from './video/video.module';
import { FtpModule } from './ftp/ftp.module';
import { ImouModule } from './imou/imou.module';
import { CameraModule } from './camera/camera.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, ftpConfig, imouConfig],
      isGlobal: true,
    }),
    CacheModule,
    PrismaModule,
    AuthModule,
    VideoModule,
    FtpModule,
    ImouModule,
    CameraModule,
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
