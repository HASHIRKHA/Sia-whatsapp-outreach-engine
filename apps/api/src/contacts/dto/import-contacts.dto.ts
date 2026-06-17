import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContactItemDto } from './contact-item.dto';

export class ImportContactsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactItemDto)
  contacts!: ContactItemDto[];

  @IsOptional()
  @IsString()
  smartListId?: string;
}
