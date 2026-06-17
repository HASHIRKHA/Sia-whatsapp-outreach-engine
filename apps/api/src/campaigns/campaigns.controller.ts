import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { LaunchCampaignDto } from './dto/launch-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Get()
  list() {
    return this.campaigns.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaigns.findOne(id);
  }

  @Post(':id/launch')
  @HttpCode(204)
  launch(@Param('id') id: string, @Body() dto: LaunchCampaignDto) {
    return this.campaigns.launch(id, dto);
  }

  @Post(':id/pause')
  @HttpCode(204)
  pause(@Param('id') id: string) {
    return this.campaigns.pause(id);
  }

  @Post(':id/resume')
  @HttpCode(204)
  resume(@Param('id') id: string) {
    return this.campaigns.resume(id);
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @Query('take') take?: string) {
    return this.campaigns.getMessages(id, take ? parseInt(take, 10) : 20);
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.campaigns.getStats(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.campaigns.delete(id);
  }
}
