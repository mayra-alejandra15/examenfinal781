import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transaction } from './entities/transaction.entity';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async getTransactions(userId: number, query: QueryTransactionsDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId });

    if (query.type) {
      qb.andWhere('transaction.type = :type', { type: query.type });
    }

    qb.orderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items.map((item) => ({
        uuid: item.uuid,
        fecha: item.createdAt,
        tipo: item.type,
        monto: Number(item.amount).toFixed(2),
        contraparte: item.counterparty,
        saldo_resultante: Number(item.resultingBalance).toFixed(2),
        descripcion: item.description,
      })),
    };
  }
}