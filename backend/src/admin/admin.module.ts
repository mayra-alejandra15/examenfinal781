import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}