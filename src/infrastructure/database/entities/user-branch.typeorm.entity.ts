import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { BranchTypeOrmEntity } from './branch.typeorm.entity';

@Entity('USER_BRANCHES')
export class UserBranchTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'USR_ID', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'USR_ID' })
  user!: UserTypeOrmEntity;

  @Column({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchTypeOrmEntity)
  @JoinColumn({ name: 'BRA_ID' })
  branch!: BranchTypeOrmEntity;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}