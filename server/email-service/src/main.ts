import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Allow larger JSON bodies so a logo uploaded from the Super Admin page
  // (stored in the DB as a data URL) can be persisted via PUT /email/config.
  app.use(json({ limit: '4mb' }));
  app.use(urlencoded({ extended: true, limit: '4mb' }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = parseInt(process.env.PORT || '3016', 10);
  await app.listen(port);
  Logger.log(`Email Service running on http://localhost:${port}`, 'EmailService');
}

bootstrap();
