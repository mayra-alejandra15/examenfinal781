import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TransferStatus } from '../../common/enums/transfer-status.enum';

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
  
  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDIENTE_CONFIRMACION,
  })
  status: TransferStatus;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column({ default: false })
  requiresTotp: boolean;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.sentTransfers)
  sender: User;

  @Column()
  senderId: number;

  @ManyToOne(() => User, (user) => user.receivedTransfers)
  receiver: User;

  @Column()
  receiverId: number;

  @CreateDateColumn()
  createdAt: Date;
}