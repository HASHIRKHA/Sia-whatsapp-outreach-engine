import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class LaunchCampaignDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  contactIds?: string[];

  @IsString()
  @IsOptional()
  smartListId?: string;

  @IsBoolean()
  @IsOptional()
  launchAll?: boolean;

  /** Restrict launch to these session IDs. Omit to use all ONLINE sessions. */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsOptional()
  sessionIds?: string[];
}
