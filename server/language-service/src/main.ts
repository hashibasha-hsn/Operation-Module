import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT || 3014;
  await app.listen(port, '0.0.0.0');
  console.log(`Language Service running on http://localhost:${port}`);
}

bootstrap();
