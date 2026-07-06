import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '../../common/enums/transaction-type.enum';

export class QueryTransactionsDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}