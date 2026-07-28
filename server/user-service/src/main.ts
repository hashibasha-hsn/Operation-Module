import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: false }));

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`User Service (auth+permission+notification) running on http://localhost:${port}`);
}

bootstrap();
