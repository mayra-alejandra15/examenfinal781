import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  destinatario: string;

  @IsNumber()
  @Min(1)
  @Max(5000)
  monto: number;

  @IsString()
  @IsOptional()
  descripcion?: string;
}