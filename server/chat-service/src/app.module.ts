import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { CommunicationModule } from './communication/communication.module';
import { ensurePostgresSchema } from './ensure-schema';

async function buildConnection(config: ConfigService) {
  const databaseUrl = config.get<string>('DATABASE_URL');
  const schema = config.get<string>('CHAT_DB_SCHEMA') || config.get<string>('DB_SCHEMA') || 'hashibasha_chat';
  const ssl = config.get<string>('DB_SSL') === 'true';

  await ensurePostgresSchema({
    schema,
    databaseUrl,
    host: config.get<string>('DB_HOST'),
    port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
    user: config.get<string>('DB_USER'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    ssl,
  });

  const host = config.get<string>('DB_HOST');
  return {
    name: 'chat',
    type: 'postgres' as const,
    ...(host
      ? {
          host,
          port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
          username: config.get<string>('DB_USER') || 'postgres',
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME') || 'postgres',
        }
      : databaseUrl
        ? { url: databaseUrl }
        : {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: config.get<string>('DB_PASSWORD'),
            database: 'postgres',
          }),
    schema,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    extra: { family: 4 },
    entities: [join(__dirname, 'communication', '**', '*.entity.{ts,js}')],
    synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
    namingStrategy: new SnakeNamingStrategy(),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(__dirname, '..', '.env')],
    }),
    TypeOrmModule.forRootAsync({
      name: 'chat',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildConnection(config),
    }),
    CommunicationModule,
  ],
})
export class AppModule {}
