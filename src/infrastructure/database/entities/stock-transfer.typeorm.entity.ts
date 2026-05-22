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
import { TransferStatusDb } from './enums/transfer-status.db-enum';
import { BranchTypeOrmEntity } from './branch.typeorm.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('STOCK_TRANSFERS')
export class StockTransferTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'FROM_BRA_ID', type: 'uuid' })
  fromBranchId!: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'FROM_BRA_ID' })
  fromBranch!: BranchTypeOrmEntity;

  @Column({ name: 'TO_BRA_ID', type: 'uuid' })
  toBranchId!: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'TO_BRA_ID' })
  toBranch!: BranchTypeOrmEntity;

  @Column({ name: 'REQ_USR_ID', type: 'uuid' })
  requesterUserId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'REQ_USR_ID' })
  requesterUser!: UserTypeOrmEntity;

  @Column({ name: 'APP_USR_ID', type: 'uuid', nullable: true })
  approverUserId?: string;

  @ManyToOne(() => UserTypeOrmEntity, { nullable: true })
  @JoinColumn({ name: 'APP_USR_ID' })
  approverUser?: UserTypeOrmEntity;

  @Index('IDX_STR_TRA_STA')
  @Column({
    name: 'STA_TRA',
    type: 'enum',
    enum: TransferStatusDb,
    default: TransferStatusDb.REQUESTED,
  })
  status!: TransferStatusDb;

  @Column({ name: 'NOT_TRA', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}