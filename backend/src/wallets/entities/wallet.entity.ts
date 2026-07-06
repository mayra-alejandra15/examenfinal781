import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  balance: number;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}