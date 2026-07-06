import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getTransactions(
    @Req() req: any,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.getTransactions(req.user.id, query);
  }
}