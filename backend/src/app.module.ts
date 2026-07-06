import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { SeedModule } from './seeders/seed.module';

import { User } from './users/entities/user.entity';
import { Wallet } from './wallets/entities/wallet.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Transfer } from './transfers/entities/transfer.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'mysql',

        host: config.get('DB_HOST'),

        port: Number(config.get('DB_PORT')),

        username: config.get('DB_USERNAME'),

        password: config.get('DB_PASSWORD'),

        database: config.get('DB_DATABASE'),

        entities: [
          User,
          Wallet,
          Transaction,
          Transfer,
          AuditLog,
          RefreshToken,
        ],

        synchronize: true,
      }),
    }),

    UsersModule,
    AuthModule,
    WalletsModule,
    TransactionsModule,
    TransfersModule,
    AuditModule,
    AdminModule,
    SeedModule,
  ],
})
export class AppModule {}