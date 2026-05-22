import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransferTypeOrmEntity } from './stock-transfer.typeorm.entity';
import { ProductTypeOrmEntity } from './product.typeorm.entity';

@Entity('STOCK_TRANSFER_DETAILS')
export class StockTransferDetailTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'STR_TRA_ID', type: 'uuid' })
  stockTransferId!: string;

  @ManyToOne(() => StockTransferTypeOrmEntity)
  @JoinColumn({ name: 'STR_TRA_ID' })
  stockTransfer!: StockTransferTypeOrmEntity;

  @Column({ name: 'PRO_ID', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductTypeOrmEntity)
  @JoinColumn({ name: 'PRO_ID' })
  product!: ProductTypeOrmEntity;

  @Column({ name: 'QTY_TRA', type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}