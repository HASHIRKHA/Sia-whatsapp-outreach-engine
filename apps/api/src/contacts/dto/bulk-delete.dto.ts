import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}
