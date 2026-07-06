import { IsOptional, IsString, Length } from 'class-validator';

export class ConfirmTransferDto {
  @IsString()
  @IsOptional()
  @Length(6, 6)
  totpCode?: string;
}