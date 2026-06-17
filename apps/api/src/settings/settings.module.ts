import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { BAILEYS_QUEUE, CLOUD_API_QUEUE, DLQ_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: CLOUD_API_QUEUE },
      { name: BAILEYS_QUEUE },
      { name: DLQ_QUEUE },
    ),
  ],
  providers: [SettingsService],
  exports: [SettingsService],
  controllers: [SettingsController],
})
export class SettingsModule {}
