import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ManageContactsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  contactIds!: string[];
}
