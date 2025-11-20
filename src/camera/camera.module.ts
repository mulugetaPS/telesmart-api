import { Module } from '@nestjs/common';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { ImouModule } from '../imou/imou.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ImouModule, PrismaModule],
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
