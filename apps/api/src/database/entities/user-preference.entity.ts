import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.preferences)
  user: User;

  @Column('simple-array', { default: '' })
  followedTags: string[];

  @Column('simple-array', { default: '' })
  followedCategories: string[];

  @Column('simple-array', { default: '' })
  keywordsInclude: string[];

  @Column('simple-array', { default: '' })
  keywordsExclude: string[];
}
