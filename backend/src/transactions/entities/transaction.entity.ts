import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TransactionType } from '../../common/enums/transaction-type.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  resultingBalance: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  counterparty: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}