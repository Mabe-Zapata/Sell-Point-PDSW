import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatusDb } from './enums/user-status.db-enum';

@Entity('USERS')
export class UserTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  isActive?: boolean;

  @Column({ name: 'ROL_USR', length: 50, nullable: true })
  role?: string;

  @Column({ name: 'EMP_ID', length: 50, unique: true })
  employeeId!: string;

  @Column({ name: 'USR_USR', length: 100, unique: true })
  username!: string;

  @Column({ name: 'EMA_USR', length: 255, unique: true })
  email!: string;

  @Column({ name: 'PAS_HASH', length: 255 })
  passwordHash!: string;

  @Column({
    name: 'STA_USR',
    type: 'enum',
    enum: UserStatusDb,
    default: UserStatusDb.ACTIVE,
  })
  status!: UserStatusDb;

  @Column({ name: 'DEF_BRA_ID', type: 'uuid', nullable: true })
  defaultBranchId?: string;

  @Column({ name: 'FAI_LOG_ATT', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
