import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, ManyToMany, JoinTable, Index,
} from 'typeorm';
import { VisibilityScope } from '@cti/shared';
import { Source } from './source.entity';
import { Category } from './category.entity';

@Entity('items')
@Index('idx_items_search', { synchronize: false })
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceId: string;

  @ManyToOne(() => Source)
  source: Source;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  collectedAt: Date;

  @Column({ unique: true })
  hash: string;

  @Column({ type: 'jsonb', nullable: true })
  rawJson: Record<string, unknown>;

  @Column({ type: 'enum', enum: VisibilityScope, default: VisibilityScope.PUBLIC })
  visibilityScope: VisibilityScope;

  @Column('simple-array', { default: '' })
  visibilityGroupIds: string[];

  // Enrichment fields stored directly
  @Column('simple-array', { default: '' })
  cves: string[];

  @Column('simple-array', { default: '' })
  cwes: string[];

  @Column('simple-array', { default: '' })
  vendors: string[];

  @Column('simple-array', { default: '' })
  products: string[];

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ nullable: true })
  severity: string;

  // Full-text search vector
  @Column({ type: 'tsvector', nullable: true, select: false })
  searchVector: string;

  @ManyToMany(() => Category)
  @JoinTable({ name: 'item_categories' })
  categories: Category[];
}
