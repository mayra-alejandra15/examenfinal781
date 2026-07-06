import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Transfer } from './entities/transfer.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transfer,
      Wallet,
      User,
      AuditLog,
      Transaction,
    ]),
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}