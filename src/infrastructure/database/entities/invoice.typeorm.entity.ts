/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { InvoiceStatusDb } from './enums/invoice-status.db-enum';
import { InvoiceItemTypeOrmEntity } from './invoice-item.typeorm.entity';

@Entity('INVOICES')
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
    type: 'enum',
    enum: InvoiceStatusDb,
  })
  status!: InvoiceStatusDb;

  @Column({ name: 'CAN_DAT', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @OneToMany(() => InvoiceItemTypeOrmEntity, (item) => item.invoice)
  items!: InvoiceItemTypeOrmEntity[];

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}