import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { dbBooleanColumn } from './db-column.helper';
import { UserRoleTypeOrmEntity } from './user-role.typeorm.entity';

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

  @OneToOne(() => UserRoleTypeOrmEntity, (userRole) => userRole.user, {
    eager: true,
  })
  userRole?: UserRoleTypeOrmEntity;

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

  @Column({ name: 'GOOGLE_ID', type: 'varchar', length: 255, nullable: true, unique: true })
  googleId?: string;

  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
