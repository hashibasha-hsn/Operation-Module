import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: false }));

  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'audit-log-service' });
  });

  const port = process.env.PORT || 3015;
  await app.listen(port);
  console.log(`AuditLog Service running on http://localhost:${port}`);
}

bootstrap();
