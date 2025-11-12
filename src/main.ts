import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService, ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const appConf = configService.get<ConfigType<typeof appConfig>>('app');

  if (!appConf) {
    throw new Error('Application configuration missing');
  }

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.use(
    ['/api', '/api-json'],
    basicAuth({
      challenge: true,
      users: {
        [appConf.swaggerUser]: appConf.swaggerPassword,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Telesmart')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(appConf?.port || 3000, () => {
    console.log(
      `Application "${appConf?.name}" is running on port ${appConf?.port}`,
    );
  });
}
bootstrap();
