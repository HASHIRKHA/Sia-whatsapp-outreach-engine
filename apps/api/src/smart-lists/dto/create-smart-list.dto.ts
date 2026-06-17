import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSmartListDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contactIds?: string[];
}
