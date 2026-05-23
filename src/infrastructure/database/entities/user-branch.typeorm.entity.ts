import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

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
}