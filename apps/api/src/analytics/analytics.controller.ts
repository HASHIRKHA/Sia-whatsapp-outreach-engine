import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService, type CampaignOverviewResponse, type OverviewResponse } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(): Promise<OverviewResponse> {
    return this.analytics.getOverview();
  }

  @Get('campaign/:id')
  campaign(@Param('id') id: string): Promise<CampaignOverviewResponse> {
    return this.analytics.getCampaignOverview(id);
  }
}
