import { IsArray, IsInt, IsObject, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ContactInputDto {
  @IsString()
  contactId!: string;

  /** E.164 phone number — required to enqueue the outbox job */
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone must be a valid E.164 number (e.g. +14155552671)' })
  phone!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  interest?: string;

  /** Arbitrary key-value personalization variables for spinText */
  @IsOptional()
  @IsObject()
  vars?: Record<string, string>;
}

export class GenerateCampaignDto {
  @IsString()
  productBrief!: string;

  @IsString()
  audience!: string;

  @IsString()
  tone!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  count!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactInputDto)
  contacts!: ContactInputDto[];

  /** If supplied, CampaignMessage records are created and jobs are enqueued */
  @IsOptional()
  @IsString()
  campaignId?: string;
}

export class GenerateTemplatesDto {
  @IsString()
  brief!: string;

  @IsString()
  audience!: string;

  @IsString()
  tone!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  count!: number;
}

export interface GeneratedMessage {
  contactId: string;
  renderedText: string;
}

export interface GenerateCampaignResult {
  campaignId?: string;
  messages: GeneratedMessage[];
}
