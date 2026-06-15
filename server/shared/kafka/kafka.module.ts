import { Module, Global } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Global()
@Module({
  providers: [
    {
      provide: 'KAFKA_SERVICE',
      useFactory: () => {
        return ClientProxyFactory.create({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'hashibasha-microservices',
              brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
            },
            consumer: {
              groupId: 'hashibasha-consumer-group',
            },
          },
        });
      },
    },
  ],
  exports: ['KAFKA_SERVICE'],
})
export class KafkaModule {}
