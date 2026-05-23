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
import { ProductTypeOrmEntity } from './product.typeorm.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('STOCK_MOVEMENTS')
export class StockMovementTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @Column({ name: 'PRE_STO_MOV', type: 'int' })
  previousStock!: number;

  @Column({ name: 'NEW_STO_MOV', type: 'int' })
  newStock!: number;

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
}