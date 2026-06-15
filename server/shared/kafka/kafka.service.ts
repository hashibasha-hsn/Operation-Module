import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('KAFKA_SERVICE') private readonly client: ClientProxy) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async emitEvent(pattern: string, data: any): Promise<void> {
    await this.client.emit(pattern, data).toPromise();
  }

  async sendEvent(pattern: string, data: any): Promise<any> {
    return await firstValueFrom(this.client.send(pattern, data));
  }
}
