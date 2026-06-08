import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('USER_BRANCHES')
export class UserBranchTypeOrmEntity {
  @PrimaryColumn({ name: 'USR_ID', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'USR_ID' })
  user!: UserTypeOrmEntity;

  @PrimaryColumn({ name: 'BRA_ID', type: 'uuid' })
  branchId!: string;
}