import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppLogger } from './common/logger/app.logger';

async function bootstrap() {
  const appLogger = new AppLogger();

  const app = await NestFactory.create(AppModule, {
    logger: appLogger,
  });

  app.use(helmet());

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lunch Management Platform API')
    .setDescription(
      'Backend API for menu management, orders, whitelist validation and operational packages',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);

  appLogger.success(`API running on http://localhost:${port}/api`);
  appLogger.debug(`Swagger docs on http://localhost:${port}/api/docs`);
}

bootstrap();
