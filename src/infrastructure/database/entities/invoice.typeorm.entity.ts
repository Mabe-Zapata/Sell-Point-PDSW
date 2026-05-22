import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceStatusDb } from './enums/invoice-status.db-enum';
import { SaleTypeOrmEntity } from './sale.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from './invoice-series.typeorm.entity';

@Entity('INVOICES')
export class InvoiceTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Legacy compatibility fields used by older seed/application code
  customerId?: string;

  invoiceDate?: Date;

  subtotal?: number;

  iva?: number;

  total?: number;

  items?: any[];

  @Column({ name: 'SAL_ID', type: 'uuid', unique: true })
  saleId!: string;

  @ManyToOne(() => SaleTypeOrmEntity)
  @JoinColumn({ name: 'SAL_ID' })
  sale!: SaleTypeOrmEntity;

  @Column({ name: 'SER_ID', type: 'uuid' })
  seriesId!: string;

  @ManyToOne(() => InvoiceSeriesTypeOrmEntity)
  @JoinColumn({ name: 'SER_ID' })
  series!: InvoiceSeriesTypeOrmEntity;

  @Column({ name: 'INV_NUM', length: 20 })
  invoiceNumber!: string;

  @Column({ name: 'AUT_NUM', length: 100 })
  authorizationNumber!: string;

  @Column({ name: 'ISS_DAT_INV', type: 'timestamp' })
  issueDate!: Date;

  @Index('IDX_INV_STA')
  @Column({
    name: 'STA_INV',
    type: 'enum',
    enum: InvoiceStatusDb,
    default: InvoiceStatusDb.ISSUED,
  })
  status!: InvoiceStatusDb;

  @Column({ name: 'CAN_AT_INV', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  updatedAt?: Date;
}
