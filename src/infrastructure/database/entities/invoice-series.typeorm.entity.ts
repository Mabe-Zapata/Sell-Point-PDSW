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

@Entity('INVOICE_SERIES')
export class InvoiceSeriesTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'BRA_ID' })
  branch!: BranchTypeOrmEntity;

  @Column({ name: 'EST_COD_SER', length: 10 })
  establishmentCode!: string;

  @Column({ name: 'EMI_POI_COD_SER', length: 10 })
  emissionPointCode!: string;

  @Column({ name: 'CUR_SEQ_SER', type: 'int', default: 0 })
  currentSequence!: number;

  @Column({ name: 'ACT_SER', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}