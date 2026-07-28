import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(process.cwd(), '.env'),
        join(process.cwd(), 'server', 'audit-log-service', '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      name: 'org',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const schema =
          config.get<string>('ORG_DB_SCHEMA') ||
          config.get<string>('DB_SCHEMA') ||
          'hashibasha_org';

        // Ensure schema exists before synchronize
        try {
          const { Client } = require('pg');
          const ssl = config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined;
          const client = databaseUrl
            ? new Client({ connectionString: databaseUrl, ssl })
            : new Client({
                host: config.get<string>('DB_HOST') || 'localhost',
                port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
                user: config.get<string>('DB_USER') || 'postgres',
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME') || 'postgres',
                ssl,
              });
          await client.connect();
          await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
          await client.end();
        } catch (error) {
          console.error('[audit-log-service] Failed to ensure schema:', error);
        }

        const host = config.get<string>('DB_HOST');
        return {
          name: 'org',
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
          ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
          extra: { family: 4 },
          entities: [join(__dirname, 'audit-logs', '**', '*.entity.{ts,js}')],
          synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
        };
      },
    }),
    AuditLogsModule,
  ],
})
export class AppModule {}
