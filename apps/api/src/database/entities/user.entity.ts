import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable, OneToMany,
} from 'typeorm';
import { Role, UserStatus } from '@cti/shared';
import { Group } from './group.entity';
import { UserPreference } from './user-preference.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'enum', enum: Role, default: Role.VIEWER })
  role: Role;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Group, (group) => group.users)
  @JoinTable({ name: 'user_groups' })
  groups: Group[];

  @OneToMany(() => UserPreference, (pref) => pref.user)
  preferences: UserPreference[];

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs: AuditLog[];
}
