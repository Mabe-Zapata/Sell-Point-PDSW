import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BranchTypeOrmEntity } from './branch.typeorm.entity';

@Entity('WAREHOUSES')
export class WarehouseTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'BRA_ID' })
  branch!: BranchTypeOrmEntity;

  @Column({ name: 'NAM_WAR', length: 100 })
  name!: string;

  @Column({ name: 'IS_MAI_WAR', type: 'boolean', default: false })
  isMain!: boolean;

  @Column({ name: 'ACT_WAR', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}