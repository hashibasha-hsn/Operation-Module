import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = parseInt(process.env.PORT || '3016', 10);
  await app.listen(port);
  Logger.log(`Email Service running on http://localhost:${port}`, 'EmailService');
}

bootstrap();
