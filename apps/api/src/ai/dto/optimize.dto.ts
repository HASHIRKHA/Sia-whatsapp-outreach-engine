import { IsString } from 'class-validator';

export class OptimizeDto {
  @IsString()
  campaignId!: string;
}

export interface VariantStat {
  text: string;
  sentCount: number;
  repliedCount: number;
  replyRate: number;
  /** Softmax-normalised recommended send weight (0–1, sums to 1 across variants) */
  weight: number;
}

export interface OptimizeResult {
  campaignId: string;
  variants: VariantStat[];
}
