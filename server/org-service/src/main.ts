import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded, Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'org-service' });
  });
  
  const port = process.env.PORT || 3012;
  await app.listen(port);
  console.log(`Organization Service running on http://localhost:${port}`);
}

bootstrap();
