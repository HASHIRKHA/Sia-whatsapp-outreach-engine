import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AntibanModule } from '../antiban/antiban.module';
import { QueueModule } from '../queue/queue.module';
import { SmartListsModule } from '../smart-lists/smart-lists.module';

@Module({
  imports: [AntibanModule, QueueModule, SmartListsModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
