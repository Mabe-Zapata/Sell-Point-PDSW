import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvoiceItemTypeOrmEntity } from './invoice-item.typeorm.entity';
import { LotTypeOrmEntity } from './lot.typeorm.entity';

@Entity('INVOICE_ITEM_LOTS')
@Index('IDX_INV_ITEM_LOTS_ITEM', ['invoiceItemId'])
@Index('IDX_INV_ITEM_LOTS_LOT', ['lotId'])
export class InvoiceItemLotTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'INV_ITEM_ID', type: 'uuid' })
  invoiceItemId!: string;

  @ManyToOne(() => InvoiceItemTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'INV_ITEM_ID' })
  invoiceItem!: InvoiceItemTypeOrmEntity;

  @Column({ name: 'LOT_ID', type: 'uuid' })
  lotId!: string;

  @ManyToOne(() => LotTypeOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'LOT_ID' })
  lot!: LotTypeOrmEntity;

  @Column({ name: 'QTY_USD', type: 'decimal', precision: 12, scale: 3 })
  quantityUsed!: number;

  @Column({ name: 'COS_UNI_LOT', type: 'decimal', precision: 12, scale: 2 })
  unitCostSnapshot!: number;

  @Column({ name: 'PRO_AMO', type: 'decimal', precision: 12, scale: 2 })
  profitAmount!: number;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}
