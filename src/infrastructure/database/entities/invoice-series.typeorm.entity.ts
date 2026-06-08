import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dbBooleanColumn } from './db-column.helper';

@Entity('INVOICE_SERIES')
export class InvoiceSeriesTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'EST_CODE', length: 10 })
  establishmentCode!: string;

  @Column({ name: 'EMI_PNT', length: 10 })
  emissionPointCode!: string;

  @Column({ name: 'CUR_SEQ', type: 'int', default: 0 })
  currentSequence!: number;

  @Column({ name: 'ACT_INV_SER', ...dbBooleanColumn() })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
