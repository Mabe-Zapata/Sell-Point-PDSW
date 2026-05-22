import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WarehouseTypeOrmEntity } from './warehouse.typeorm.entity';
import { ProductTypeOrmEntity } from './product.typeorm.entity';

@Entity('INVENTORIES')
export class InventoryTypeOrmEntity {
  @Column({ name: 'WAR_ID', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => WarehouseTypeOrmEntity)
  @JoinColumn({ name: 'WAR_ID' })
  warehouse!: WarehouseTypeOrmEntity;

  @Column({ name: 'PRO_ID', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductTypeOrmEntity)
  @JoinColumn({ name: 'PRO_ID' })
  product!: ProductTypeOrmEntity;

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'CUR_STO', type: 'int', default: 0 })
  currentStock!: number;

  @Column({ name: 'MIN_STO', type: 'int', default: 0 })
  minimumStock!: number;

  @Column({ name: 'MAX_STO', type: 'int', default: 0 })
  maximumStock!: number;

  @Index('IDX_INV_CUR_STO')
  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}