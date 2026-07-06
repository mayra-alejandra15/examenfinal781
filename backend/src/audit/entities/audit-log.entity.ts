import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  user: User | null;

  @Column({ nullable: true })
  userId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}