import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  actorUserId: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'actorUserId' })
  actor: User;

  @Column()
  action: string;

  @Column()
  objectType: string;

  @Column({ nullable: true })
  objectId: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  diffJson: Record<string, unknown>;
}
