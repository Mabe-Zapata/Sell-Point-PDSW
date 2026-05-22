import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentMethodDb } from './enums/payment-method.db-enum';
import { SaleTypeOrmEntity } from './sale.typeorm.entity';

@Entity('PAYMENTS')
export class PaymentTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'SAL_ID', type: 'uuid' })
  saleId!: string;

  @ManyToOne(() => SaleTypeOrmEntity)
  @JoinColumn({ name: 'SAL_ID' })
  sale!: SaleTypeOrmEntity;

  @Column({
    name: 'MET_PAY',
    type: 'enum',
    enum: PaymentMethodDb,
  })
  method!: PaymentMethodDb;

  @Column({ name: 'AMO_PAY', type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ name: 'REF_PAY', length: 100, nullable: true })
  reference?: string;

  @Index('IDX_PAY_PAI_AT')
  @Column({ name: 'PAI_AT', type: 'timestamp' })
  paidAt!: Date;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}