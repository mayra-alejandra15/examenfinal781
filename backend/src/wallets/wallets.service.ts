import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TopupDto } from './dto/topup.dto';
import type { Request } from 'express';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getWallet(userId: number) {
    const wallet = await this.walletRepo.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Billetera no encontrada');
    }

    return {
      uuid: wallet.uuid,
      balance: wallet.balance,
    };
  }

  async topup(userId: number, dto: TopupDto, req: Request) {
    const wallet = await this.walletRepo.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Billetera no encontrada');
    }

    const currentBalance = Number(wallet.balance);
    const amount = Number(dto.amount);
    const newBalance = currentBalance + amount;

    wallet.balance = newBalance;
    await this.walletRepo.save(wallet);

    await this.transactionRepo.save({
      uuid: uuidv4(),
      type: TransactionType.RECARGA,
      amount,
      resultingBalance: newBalance,
      counterparty: null,
      description: 'Recarga de saldo simulada',
      userId,
    });

    await this.auditRepo.save({
      action: 'TOPUP',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId,
      metadata: {
        amount,
        resultingBalance: newBalance,
      },
    });

    return {
      message: 'Recarga realizada correctamente',
      wallet: {
        uuid: wallet.uuid,
        balance: newBalance.toFixed(2),
      },
    };
  }
}