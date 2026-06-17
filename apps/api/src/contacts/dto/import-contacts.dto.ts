import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContactItemDto } from './contact-item.dto';

export class ImportContactsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactItemDto)
  contacts!: ContactItemDto[];
}
