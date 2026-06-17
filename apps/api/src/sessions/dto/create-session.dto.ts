import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  label!: string;

  @IsIn(['CLOUD_API', 'BAILEYS'])
  mode!: 'CLOUD_API' | 'BAILEYS';

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsObject()
  cloudApi?: { phoneNumberId: string; wabaId: string };
}
