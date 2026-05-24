import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dbBooleanColumn } from './db-column.helper';

@Entity('CATEGORIES')
export class CategoryTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'NAM_CAT', length: 100 })
  name!: string;

  @Column({ name: 'DES_CAT', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'ACT_CAT', ...dbBooleanColumn() })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
