import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getUsers() {
    const users = await this.userRepo.find({
      relations: {
        wallet: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => ({
      uuid: user.uuid,
      fullName: user.fullName,
      ci: user.ci,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isBlocked: user.isBlocked,
      blockedUntil: user.blockedUntil,
      mfaEnabled: user.mfaEnabled,
      wallet: {
        uuid: user.wallet?.uuid,
        balance: user.wallet?.balance,
      },
      createdAt: user.createdAt,
    }));
  }

  async blockOrUnblockUser(uuid: string, blocked: boolean) {
    const user = await this.userRepo.findOne({
      where: { uuid },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isBlocked = blocked;
    user.blockedUntil = blocked ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await this.userRepo.save(user);

    return {
      message: blocked
        ? 'Usuario bloqueado correctamente'
        : 'Usuario desbloqueado correctamente',
      user: {
        uuid: user.uuid,
        fullName: user.fullName,
        email: user.email,
        isBlocked: user.isBlocked,
        blockedUntil: user.blockedUntil,
      },
    };
  }

  async getAuditLogs(pageParam?: string, limitParam?: string) {
    const page = Math.max(Number(pageParam) || 1, 1);
    const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await this.auditRepo.findAndCount({
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        ip: log.ip,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.createdAt,
        user: log.user
          ? {
              uuid: log.user.uuid,
              fullName: log.user.fullName,
              email: log.user.email,
            }
          : null,
      })),
    };
  }
} 