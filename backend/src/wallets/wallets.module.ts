import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Transaction, AuditLog])],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService, TypeOrmModule],
})
export class WalletsModule {}