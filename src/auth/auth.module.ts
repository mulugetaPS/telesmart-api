import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ExternalOtpService } from './external-otp.service';
import { ImouModule } from '../imou/imou.module';
import { PrismaModule } from '../prisma/prisma.module';
import authConfig from 'src/config/auth.config';

@Module({
  imports: [
    PrismaModule,
    ImouModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule.forFeature(authConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>('auth.jwt.secret')!,
        signOptions: {
          expiresIn: config.get('auth.jwt.expiresIn')!,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ExternalOtpService],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
