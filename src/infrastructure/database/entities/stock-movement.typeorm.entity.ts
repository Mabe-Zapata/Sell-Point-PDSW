import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockMovementTypeDb } from './enums/stock-movement-type.db-enum';
import { WarehouseTypeOrmEntity } from './warehouse.typeorm.entity';
import { ProductTypeOrmEntity } from './product.typeorm.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('STOCK_MOVEMENTS')
export class StockMovementTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({
    name: 'TYP_MOV',
    type: 'enum',
    enum: StockMovementTypeDb,
  })
  type!: StockMovementTypeDb;

  @Column({ name: 'QTY_MOV', type: 'decimal', precision: 10, scale: 3 })
  quantity!: number;

  @Column({ name: 'STO_BEF', type: 'int' })
  stockBefore!: number;

  @Column({ name: 'STO_AFT', type: 'int' })
  stockAfter!: number;

  @Column({ name: 'USR_ID', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => UserTypeOrmEntity, { nullable: true })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserTypeOrmEntity;

  @Column({ name: 'REF_TYP', length: 50, nullable: true })
  referenceType?: string;

  @Column({ name: 'REF_ID', type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ name: 'DES_MOV', type: 'text', nullable: true })
  description?: string;

  @Index('IDX_STR_MOV_CREATED_AT')
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @Index('IDX_STR_MOV_TYP')
  @Column({ name: 'TYP_MOV_IDX', type: 'varchar', length: 50 })
  typeIndex!: string;
}