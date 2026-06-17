import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SessionMode } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsEnum(SessionMode)
  mode!: SessionMode;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  activeFrom?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  activeTo?: number;
}
