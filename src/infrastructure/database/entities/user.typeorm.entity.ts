import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatusDb } from './enums/user-status.db-enum';
import { dbBooleanColumn } from './db-column.helper';

@Entity('USERS')
export class UserTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'FIR_NAM_USR', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'LAS_NAM_USR', length: 100, nullable: true })
  lastName?: string;

  @Column({ name: 'CED_USR', length: 20, nullable: true })
  cedula?: string;

  @Column({ name: 'ACT_USR', ...dbBooleanColumn() })
  isActive!: boolean;

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

  @Column({ name: 'CURRENT_PAS_HASH', length: 255, nullable: true })
  currentPasswordHash?: string;

  @Column({ name: 'PAS_EXPIRED', ...dbBooleanColumn(false) })
  passwordExpired!: boolean;

  @Column({
    name: 'STA_USR',
    type: 'varchar',
    length: 30,
    default: 'ACTIVE',
  })
  status!: string;

  @Column({ name: 'DEF_BRA_ID', type: 'uuid', nullable: true })
  defaultBranchId?: string;

  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
