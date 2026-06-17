import { Inject, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AntibanModule } from '../antiban/antiban.module';
import { CloudApiModule } from '../cloud-api/cloud-api.module';
import { SessionsModule } from '../sessions/sessions.module';
import { BAILEYS_QUEUE, CLOUD_API_QUEUE, DLQ_QUEUE, REDIS_CLIENT } from './queue.constants';
import { OutboxProducer } from './outbox.producer';
import { CloudApiWorker } from './cloud-api.worker';
import { BaileysWorker } from './baileys.worker';

@Injectable()
class RedisShutdownService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawUrl = config.getOrThrow<string>('REDIS_URL');
        const url = new URL(rawUrl);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            password: url.password || undefined,
            db: Number(url.pathname.slice(1)) || 0,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: CLOUD_API_QUEUE },
      { name: BAILEYS_QUEUE },
      { name: DLQ_QUEUE },
    ),
    AntibanModule,
    CloudApiModule,
    SessionsModule,
  ],
  providers: [
    OutboxProducer,
    CloudApiWorker,
    BaileysWorker,
    RedisShutdownService,
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        return new Redis(config.getOrThrow<string>('REDIS_URL'), {
          maxRetriesPerRequest: null,
          lazyConnect: false,
        });
      },
    },
  ],
  exports: [OutboxProducer, REDIS_CLIENT],
})
export class QueueModule {}
