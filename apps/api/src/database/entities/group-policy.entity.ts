import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
} from 'typeorm';
import { Group } from './group.entity';

@Entity('group_policies')
export class GroupPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @OneToOne(() => Group, (group) => group.policy)
  @JoinColumn()
  group: Group;

  @Column('simple-array', { default: '' })
  followedTags: string[];

  @Column('simple-array', { default: '' })
  followedCategories: string[];

  @Column('simple-array', { default: '' })
  keywordsInclude: string[];

  @Column('simple-array', { default: '' })
  keywordsExclude: string[];

  @Column({ type: 'jsonb', nullable: true })
  dashboardJson: Record<string, unknown>;
}
