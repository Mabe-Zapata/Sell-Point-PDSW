import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { dbBooleanColumn } from './db-column.helper';
import { TaxRateTypeOrmEntity } from './tax-rate.typeorm.entity';

@Entity('CATEGORIES')
export class CategoryTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'NAM_CAT', length: 100 })
  name!: string;

  @Column({ name: 'DES_CAT', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'TAX_RAT_ID', type: 'uuid' })
  taxRateId!: string;

  @ManyToOne(() => TaxRateTypeOrmEntity)
  @JoinColumn({ name: 'TAX_RAT_ID' })
  taxRate?: TaxRateTypeOrmEntity;

  @Column({ name: 'ACT_CAT', ...dbBooleanColumn() })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
