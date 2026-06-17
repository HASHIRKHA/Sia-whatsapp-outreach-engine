import { IsOptional, IsString } from 'class-validator';

export class AnalyzeReplyDto {
  @IsString()
  contactId!: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsString()
  text!: string;
}

export type Sentiment = 'HOT' | 'WARM' | 'COLD' | 'NEGATIVE';
export type ReplyIntent = 'BUYING' | 'QUESTION' | 'OBJECTION' | 'OPT_OUT';

export interface ReplyAnalysis {
  sentiment: Sentiment;
  intent: ReplyIntent;
  score: number;
  action: string;
}
