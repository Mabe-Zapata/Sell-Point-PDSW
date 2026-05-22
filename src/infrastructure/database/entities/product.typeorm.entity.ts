import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoryTypeOrmEntity } from './category.typeorm.entity';

@Entity('PRODUCTS')
export class ProductTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Legacy compatibility fields used by older seed/application code
  unitPrice?: number;

  availableQuantity?: number;

  @Column({ name: 'CAT_ID', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => CategoryTypeOrmEntity)
  @JoinColumn({ name: 'CAT_ID' })
  category!: CategoryTypeOrmEntity;

  @Column({ name: 'COD_PRO', length: 50, unique: true })
  code!: string;

  @Column({ name: 'NAM_PRO', length: 255 })
  name!: string;

  description?: string;

  @Column({ name: 'SAL_PRI_PRO', type: 'decimal', precision: 12, scale: 2 })
  salePrice!: number;

  @Column({ name: 'COS_PRI_PRO', type: 'decimal', precision: 12, scale: 2 })
  costPrice!: number;

  @Index('IDX_PRO_ACT')
  @Column({ name: 'ACT_PRO', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
