import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Transfer } from '../../transfers/entities/transfer.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'char', length: 36, unique: true })
    uuid: string;

    @Column()
    fullName: string;

    @Column({ unique: true })
    ci: string;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true })
    phone: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: false })
    isBlocked: boolean;

    @Column({ type: 'datetime', nullable: true })
    blockedUntil: Date | null;

    @Column({ default: 0 })
    failedLoginAttempts: number;

    @Column({ default: false })
    mfaEnabled: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    mfaSecret: string;

    @OneToOne(() => Wallet, (wallet) => wallet.user)
    wallet: Wallet;

    @OneToMany(() => Transaction, (transaction) => transaction.user)
    transactions: Transaction[];

    @OneToMany(() => Transfer, (transfer) => transfer.sender)
    sentTransfers: Transfer[];

    @OneToMany(() => Transfer, (transfer) => transfer.receiver)
    receivedTransfers: Transfer[];

    @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
    auditLogs: AuditLog[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}