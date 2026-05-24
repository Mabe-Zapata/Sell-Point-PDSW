import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { dbBooleanColumn } from './db-column.helper';

@Entity('TAX_RATES')
export class TaxRateTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'NAM_TAX', length: 100 })
  name!: string;

  @Column({ name: 'PCT_TAX', type: 'decimal', precision: 5, scale: 2 })
  percentage!: number;

  @Index('IDX_TAX_ACT')
  @Column({ name: 'ACT_TAX', ...dbBooleanColumn() })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
