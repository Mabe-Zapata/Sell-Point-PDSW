 
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

  @OneToMany(() => InvoiceItemTypeOrmEntity, (item) => item.invoice)
  items!: InvoiceItemTypeOrmEntity[];

  // === Audit Snapshot Columns ===

  @Column({ name: 'CUS_NAM_SNA', length: 255, nullable: true })
  customerNameSnapshot?: string;

  @Column({ name: 'CUS_CED_SNA', length: 20, nullable: true })
  customerCedulaSnapshot?: string;

  @Column({ name: 'CUS_EMA_SNA', length: 255, nullable: true })
  customerEmailSnapshot?: string;

  @Column({ name: 'CAS_NAM_SNA', length: 255, nullable: true })
  cashierNameSnapshot?: string;

  @Column({ name: 'CAS_USR_SNA', length: 100, nullable: true })
  cashierUsernameSnapshot?: string;

  @Column({ name: 'CAS_EMP_SNA', length: 50, nullable: true })
  cashierEmployeeIdSnapshot?: string;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}
