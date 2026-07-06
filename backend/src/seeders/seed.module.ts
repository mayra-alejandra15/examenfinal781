import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeedService } from './seed.service';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wallet])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}