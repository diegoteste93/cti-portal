import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable,
} from 'typeorm';
import { SourceType, VisibilityScope } from '@cti/shared';
import { Category } from './category.entity';

@Entity('sources')
export class Source {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: SourceType })
  type: SourceType;

  @Column()
  url: string;

  @Column({ default: '0 */6 * * *' })
  scheduleCron: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'text', nullable: true })
  authConfigEncrypted: string;

  @Column({ type: 'jsonb', nullable: true })
  mappingConfigJson: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  headersJson: Record<string, string>;

  @Column({ type: 'enum', enum: VisibilityScope, default: VisibilityScope.PUBLIC })
  visibilityScope: VisibilityScope;

  @Column('simple-array', { default: '' })
  visibilityGroupIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Category)
  @JoinTable({ name: 'source_categories' })
  categories: Category[];
}
