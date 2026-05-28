import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
//import { SaleStatusDb } from './enums/sale-status.db-enum';
import { PaymentMethodDb } from './enums/payment-method.db-enum';
import { CustomerTypeOrmEntity } from './customer.typeorm.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('SALES')
export class SaleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id!: string;

  @Column({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'CUS_ID', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => CustomerTypeOrmEntity)
  @JoinColumn({ name: 'CUS_ID' })
  customer!: CustomerTypeOrmEntity;

  @Column({ name: 'CAS_USR_ID', type: 'uuid' })
  cashierUserId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'CAS_USR_ID' })
  cashierUser!: UserTypeOrmEntity;

  @Index('IDX_SAL_NUM')
  @Column({ name: 'SAL_NUM', length: 50 })
  saleNumber!: string;

  @Column({
    name: 'PAY_MET_SAL',
    type: 'varchar',
    length: 20,
    default: PaymentMethodDb.CASH,
  })
  paymentMethod!: string;

  @Index('IDX_SAL_STA')
  @Column({
    name: 'STA_SAL',
    type: 'varchar',
    length: 30,
    default: 'DRAFT',
  })
  status!: string;

  @Column({ name: 'SUB_SAL', type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ name: 'TAX_AMO_SAL', type: 'decimal', precision: 12, scale: 2 })
  taxAmount!: number;

  @Column({ name: 'DIS_AMO_SAL', type: 'decimal', precision: 12, scale: 2 })
  discountAmount!: number;

  @Column({ name: 'TOT_SAL', type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Index('IDX_SAL_CREATED_AT')
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
