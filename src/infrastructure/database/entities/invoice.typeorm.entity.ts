import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerTypeOrmEntity } from './customer.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from './invoice-item.typeorm.entity';

@Entity('INVOICES')
export class InvoiceTypeOrmEntity {
  @ApiProperty({ description: 'Invoice unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Invoice number' })
  @Column({ name: 'NUM_INV', length: 20, unique: true })
  invoiceNumber!: string;

  @ApiProperty({ description: 'Invoice date (server-generated)' })
  @Column({ name: 'FEC_INV', type: 'timestamp' })
  invoiceDate!: Date;

  @ApiProperty({ description: 'Customer ID' })
  @Column({ name: 'ID_CUS_INV', type: 'uuid' })
  customerId!: string;

  @ApiProperty({ description: 'Customer relationship' })
  @ManyToOne(() => CustomerTypeOrmEntity)
  @JoinColumn({ name: 'ID_CUS_INV' })
  customer!: CustomerTypeOrmEntity;

  @ApiProperty({ description: 'Subtotal amount' })
  @Column({ name: 'SUB_TOT', type: 'decimal', precision: 12, scale: 2 })
  subtotal!: number;

  @ApiProperty({ description: 'IVA amount' })
  @Column({ name: 'IVA_TOT', type: 'decimal', precision: 12, scale: 2 })
  iva!: number;

  @ApiProperty({ description: 'Total amount' })
  @Column({ name: 'TOT_INV', type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @ApiProperty({ description: 'Invoice items' })
  @OneToMany(() => InvoiceItemTypeOrmEntity, (item) => item.invoice, {
    cascade: true,
  })
  items!: InvoiceItemTypeOrmEntity[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ name: 'DEL_AT' })
  deletedAt?: Date;
}
