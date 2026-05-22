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
import { SaleStatusDb } from './enums/sale-status.db-enum';
import { BranchTypeOrmEntity } from './branch.typeorm.entity';
import { CustomerTypeOrmEntity } from './customer.typeorm.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { TaxRateTypeOrmEntity } from './tax-rate.typeorm.entity';

@Entity('SALES')
export class SaleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'BRA_ID' })
  branch!: BranchTypeOrmEntity;

  @Column({ name: 'CUS_ID', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => CustomerTypeOrmEntity)
  @JoinColumn({ name: 'CUS_ID' })
  customer!: CustomerTypeOrmEntity;

  @Column({ name: 'CAS_USR_ID', type: 'uuid' })
  cashierUserId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'CAS_USR_ID' })
  cashierUser!: UserTypeOrmEntity;

  @Column({ name: 'TAX_RAT_ID', type: 'uuid' })
  taxRateId!: string;

  @ManyToOne(() => TaxRateTypeOrmEntity)
  @JoinColumn({ name: 'TAX_RAT_ID' })
  taxRate!: TaxRateTypeOrmEntity;

  @Column({ name: 'SAL_NUM', length: 50, unique: true })
  saleNumber!: string;

  @Index('IDX_SAL_STA')
  @Column({
    name: 'STA_SAL',
    type: 'enum',
    enum: SaleStatusDb,
    default: SaleStatusDb.DRAFT,
  })
  status!: SaleStatusDb;

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