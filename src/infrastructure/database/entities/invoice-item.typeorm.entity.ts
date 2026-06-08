import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceTypeOrmEntity } from './invoice.typeorm.entity';
import { ProductTypeOrmEntity } from './product.typeorm.entity';
import { TaxRateTypeOrmEntity } from './tax-rate.typeorm.entity';

@Entity('INVOICE_ITEMS')
export class InvoiceItemTypeOrmEntity {
  @ApiProperty({ description: 'Invoice item unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Invoice ID' })
  @Column({ name: 'ID_INV_DET', type: 'uuid' })
  invoiceId!: string;

  @ApiProperty({ description: 'Invoice relationship' })
  @ManyToOne(() => InvoiceTypeOrmEntity, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ID_INV_DET' })
  invoice!: InvoiceTypeOrmEntity;

  @ApiProperty({ description: 'Product ID' })
  @Column({ name: 'ID_PRO_DET', type: 'uuid' })
  productId!: string;

  @ApiProperty({ description: 'Product relationship' })
  @ManyToOne(() => ProductTypeOrmEntity)
  @JoinColumn({ name: 'ID_PRO_DET' })
  product!: ProductTypeOrmEntity;

  @ApiProperty({ description: 'Product name snapshot at invoice time' })
  @Column({ name: 'PRO_NAM_INV', length: 255, nullable: true })
  productNameSnapshot?: string;

  @ApiProperty({ description: 'Quantity sold' })
  @Column({ name: 'CAN_VEN', type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @ApiProperty({ description: 'Unit price at time of sale (historical)' })
  @Column({ name: 'PRI_UNI_VEN', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @ApiProperty({ description: 'Applied tax rate ID at invoice time' })
  @Column({ name: 'TAX_RAT_ID', type: 'uuid', nullable: true })
  taxRateId?: string;

  @ManyToOne(() => TaxRateTypeOrmEntity, { nullable: true })
  @JoinColumn({ name: 'TAX_RAT_ID' })
  taxRate?: TaxRateTypeOrmEntity;

  @ApiProperty({ description: 'Applied tax percentage snapshot' })
  @Column({ name: 'TAX_PCT_INV', type: 'decimal', precision: 5, scale: 2, nullable: true })
  taxPercentage?: number;

  @ApiProperty({ description: 'Applied tax amount snapshot' })
  @Column({ name: 'TAX_AMO_INV', type: 'decimal', precision: 12, scale: 2, nullable: true })
  taxAmount?: number;
}
