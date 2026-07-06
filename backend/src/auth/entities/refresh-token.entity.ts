import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tokenHash: string;

  @Column()
  familyId: string;

  @Column({ default: false })
  revoked: boolean;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}