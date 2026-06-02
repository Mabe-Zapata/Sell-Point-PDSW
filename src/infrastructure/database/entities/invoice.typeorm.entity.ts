 
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InvoiceStatusDb } from './enums/invoice-status.db-enum';
import { InvoiceItemTypeOrmEntity } from './invoice-item.typeorm.entity';

@Entity('INVOICES')
@Index('UQ_INVOICES_SALE_ID', ['saleId'], { unique: true })
export class InvoiceTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'SAL_ID', type: 'uuid' })
  saleId!: string;

  @Column({ name: 'SER_ID', type: 'uuid' })
  seriesId!: string;

  @Column({ name: 'INV_NUM', length: 50, unique: true })
  invoiceNumber!: string;

  @Column({ name: 'AUTH_NUM', length: 100, nullable: true })
  authorizationNumber?: string;

  @Column({ name: 'ISS_DAT', type: 'timestamp' })
  issueDate!: Date;

  @Column({
    name: 'STA_INV',
    type: 'varchar',
    length: 30,
  })
  status!: string;

  @Column({ name: 'CAN_DAT', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'PRO_TOT_INV', type: 'decimal', precision: 12, scale: 2, nullable: true })
  profitTotal?: number;

  @OneToMany(() => InvoiceItemTypeOrmEntity, (item) => item.invoice)
  items!: InvoiceItemTypeOrmEntity[];

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}
