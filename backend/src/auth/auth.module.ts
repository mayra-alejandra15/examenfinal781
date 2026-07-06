import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshToken, User, Wallet, AuditLog]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}