import { IsEnum, IsOptional, IsString } from 'class-validator';

export type ConnectMethod = 'qr' | 'pairing';

export class ConnectSessionDto {
  @IsEnum(['qr', 'pairing'])
  method!: ConnectMethod;

  @IsOptional()
  @IsString()
  phone?: string;
}
