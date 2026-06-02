import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductTypeOrmEntity } from './product.typeorm.entity';

@Entity('LOTS')
@Index('IDX_LOTS_FIFO', ['productId', 'receivedAt', 'deletedAt'])
export class LotTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'PRO_ID', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductTypeOrmEntity)
  @JoinColumn({ name: 'PRO_ID' })
  product!: ProductTypeOrmEntity;

  @Column({ name: 'LOT_COD', length: 80 })
  lotCode!: string;

  @Column({ name: 'QTY_ING', type: 'decimal', precision: 12, scale: 3 })
  quantityReceived!: number;

  @Column({ name: 'QTY_AVL', type: 'decimal', precision: 12, scale: 3 })
  quantityAvailable!: number;

  @Column({ name: 'COS_UNI_LOT', type: 'decimal', precision: 12, scale: 2 })
  unitCost!: number;

  @Column({ name: 'EST_UNI_PRO', type: 'decimal', precision: 12, scale: 2 })
  estimatedUnitProfit!: number;

  @Column({ name: 'ING_DAT', type: 'timestamp' })
  receivedAt!: Date;

  @Column({ name: 'EXP_DAT', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'DEL_AT', nullable: true })
  deletedAt?: Date;
}
