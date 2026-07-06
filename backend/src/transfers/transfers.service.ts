import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Transfer } from './entities/transfer.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferStatus } from '../common/enums/transfer-status.enum';
import type { Request } from 'express';
import { DataSource } from 'typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';

@Injectable()
export class TransfersService {
    constructor(
        @InjectRepository(Transfer)
        private readonly transferRepo: Repository<Transfer>,

        @InjectRepository(Wallet)
        private readonly walletRepo: Repository<Wallet>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
        @InjectRepository(Transaction)
        private readonly transactionRepo: Repository<Transaction>,

        private readonly dataSource: DataSource,
    ) { }

    async createTransfer(
        senderId: number,
        dto: CreateTransferDto,
        idempotencyKey: string,
        req: Request,
    ) {
        if (!idempotencyKey) {
            throw new BadRequestException('Idempotency-Key es obligatorio');
        }

        const existing = await this.transferRepo.findOne({
            where: { idempotencyKey },
        });

        if (existing) {
            return {
                uuid: existing.uuid,
                estado: existing.status,
                requiere_totp: existing.requiresTotp,
                expira_en: 120,
            };
        }

        const amount = Number(dto.monto);

        const senderWallet = await this.walletRepo.findOne({
            where: { userId: senderId },
        });

        if (!senderWallet) {
            throw new NotFoundException('Billetera del remitente no encontrada');
        }

        if (Number(senderWallet.balance) < amount) {
            throw new BadRequestException('Saldo insuficiente');
        }

        const receiver = await this.userRepo.findOne({
            where: [
                { email: dto.destinatario },
                { phone: dto.destinatario },
            ],
        });

        if (!receiver) {
            throw new NotFoundException('Destinatario no encontrado');
        }

        if (receiver.id === senderId) {
            throw new BadRequestException('No puedes transferirte a ti mismo');
        }

        const transfer = this.transferRepo.create({
            uuid: uuidv4(),
            amount,
            description: dto.descripcion ?? null,
            status: TransferStatus.PENDIENTE_CONFIRMACION,
            idempotencyKey,
            requiresTotp: amount > 500,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            senderId,
            receiverId: receiver.id,
        });

        const saved = await this.transferRepo.save(transfer);

        await this.auditRepo.save({
            action: 'TRANSFER_CREATED',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: senderId,
            metadata: {
                amount,
                receiver: receiver.email,
                transferUuid: saved.uuid,
            },
        });

        return {
            uuid: saved.uuid,
            estado: saved.status,
            destinatario: receiver.fullName,
            requiere_totp: saved.requiresTotp,
            expira_en: 900,
        };
    }
    async confirmTransfer(
        userId: number,
        transferUuid: string,
        dto: ConfirmTransferDto,
        req: Request,
    ) {
        const transfer = await this.transferRepo.findOne({
            where: {
                uuid: transferUuid,
                senderId: userId,
            },
            relations: {
                receiver: true,
                sender: true,
            },
        });

        if (!transfer) {
            throw new NotFoundException('Transferencia no encontrada');
        }

        if (transfer.status !== TransferStatus.PENDIENTE_CONFIRMACION) {
            throw new BadRequestException('La transferencia ya fue procesada');
        }

        if (transfer.expiresAt < new Date()) {
            transfer.status = TransferStatus.CANCELADA;
            await this.transferRepo.save(transfer);
            throw new BadRequestException('La transferencia expiró');
        }

        if (transfer.requiresTotp && !dto.totpCode) {
            throw new BadRequestException('Código TOTP requerido');
        }

        const amount = Number(transfer.amount);

        await this.dataSource.transaction(async (manager) => {
            const senderWallet = await manager.findOne(Wallet, {
                where: { userId: transfer.senderId },
                lock: { mode: 'pessimistic_write' },
            });

            const receiverWallet = await manager.findOne(Wallet, {
                where: { userId: transfer.receiverId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!senderWallet || !receiverWallet) {
                throw new NotFoundException('Billetera no encontrada');
            }

            if (Number(senderWallet.balance) < amount) {
                throw new BadRequestException('Saldo insuficiente');
            }

            const senderNewBalance = Number(senderWallet.balance) - amount;
            const receiverNewBalance = Number(receiverWallet.balance) + amount;

            senderWallet.balance = senderNewBalance;
            receiverWallet.balance = receiverNewBalance;

            await manager.save(Wallet, senderWallet);
            await manager.save(Wallet, receiverWallet);

            transfer.status = TransferStatus.COMPLETADA;
            await manager.save(Transfer, transfer);

            await manager.save(Transaction, {
                uuid: uuidv4(),
                type: TransactionType.ENVIO,
                amount,
                resultingBalance: senderNewBalance,
                counterparty: transfer.receiver.email,
                description: transfer.description,
                userId: transfer.senderId,
            });

            await manager.save(Transaction, {
                uuid: uuidv4(),
                type: TransactionType.RECEPCION,
                amount,
                resultingBalance: receiverNewBalance,
                counterparty: transfer.sender.email,
                description: transfer.description,
                userId: transfer.receiverId,
            });
        });

        await this.auditRepo.save({
            action: 'TRANSFER_CONFIRMED',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId,
            metadata: {
                transferUuid,
                amount,
            },
        });

        return {
            message: 'Transferencia confirmada correctamente',
            transfer: {
                uuid: transfer.uuid,
                estado: TransferStatus.COMPLETADA,
                monto: amount.toFixed(2),
                destinatario: transfer.receiver.fullName,
            },
        };
    }
   
}