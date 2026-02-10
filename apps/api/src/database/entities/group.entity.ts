import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
  OneToOne, CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { GroupPolicy } from './group-policy.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => User, (user) => user.groups)
  users: User[];

  @OneToOne(() => GroupPolicy, (policy) => policy.group, { cascade: true })
  policy: GroupPolicy;
}
