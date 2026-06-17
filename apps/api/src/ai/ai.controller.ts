import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateCampaignDto, GenerateTemplatesDto, type GenerateCampaignResult } from './dto/generate-campaign.dto';
import { AnalyzeReplyDto, type ReplyAnalysis } from './dto/analyze-reply.dto';
import { OptimizeDto, type OptimizeResult } from './dto/optimize.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('generate-campaign')
  generateCampaign(@Body() dto: GenerateCampaignDto): Promise<GenerateCampaignResult> {
    return this.ai.generateCampaign(dto);
  }

  @Post('generate-templates')
  generateTemplates(@Body() dto: GenerateTemplatesDto): Promise<{ messages: string[] }> {
    return this.ai.generateTemplates(dto);
  }

  @Post('analyze-reply')
  analyzeReply(@Body() dto: AnalyzeReplyDto): Promise<ReplyAnalysis> {
    return this.ai.analyzeReply(dto);
  }

  @Post('optimize')
  optimize(@Body() dto: OptimizeDto): Promise<OptimizeResult> {
    return this.ai.optimize(dto);
  }
}
