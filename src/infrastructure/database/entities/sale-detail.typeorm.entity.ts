import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SaleTypeOrmEntity } from './sale.typeorm.entity';
import { ProductTypeOrmEntity } from './product.typeorm.entity';

@Entity('SALE_DETAILS')
export class SaleDetailTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'SAL_ID', type: 'uuid' })
  saleId!: string;

  @ManyToOne(() => SaleTypeOrmEntity)
  @JoinColumn({ name: 'SAL_ID' })
  sale!: SaleTypeOrmEntity;

  @Column({ name: 'PRO_ID', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductTypeOrmEntity)
  @JoinColumn({ name: 'PRO_ID' })
  product!: ProductTypeOrmEntity;

  @Column({ name: 'PRO_NAM_SAL', length: 255 })
  productNameSnapshot!: string;

  @Column({ name: 'PRO_COD_SAL', length: 50 })
  productCodeSnapshot!: string;

  @Column({ name: 'QTY_SAL_DET', type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @Column({ name: 'UNT_PRI_SAL', type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  @Index('IDX_SAL_DET_SAL_ID')
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}