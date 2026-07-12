import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  
  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  console.log(`Auth Service running on http://localhost:${port}`);
}

bootstrap();
