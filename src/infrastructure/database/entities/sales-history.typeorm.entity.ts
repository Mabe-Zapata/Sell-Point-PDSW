import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { SaleTypeOrmEntity } from './sale.typeorm.entity';

@Entity('SALES_HISTORY')
export class SalesHistoryTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'SAL_ID', type: 'uuid', unique: true })
  saleId!: string;

  @Column({ name: 'ORI_CRE_AT', type: 'timestamp' })
  originalCreatedAt!: Date;

  @Column({ name: 'MOVED_AT', type: 'timestamp' })
  movedAt!: Date;
}