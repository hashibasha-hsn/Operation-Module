import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfigModule } from './email-config/email-config.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { HealthController } from './health.controller';
import { GraphEmailProvider } from './providers/graph.provider';
import { SmtpEmailProvider } from './providers/smtp.provider';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'hashibasha_notification',
          }),
      schema: process.env.DB_SCHEMA || 'hashibasha_notification',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      extra: process.env.DB_SSL === 'true' ? { family: 4 } : undefined,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    EmailConfigModule,
  ],
  controllers: [EmailController, HealthController],
  providers: [EmailService, GraphEmailProvider, SmtpEmailProvider],
})
export class AppModule {}
