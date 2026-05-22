import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('USERS')
export class UserTypeOrmEntity {
  @ApiProperty({ description: 'User unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Employee identifier' })
  @Column({ name: 'EMP_ID', length: 50 })
  employeeId!: string;

  @ApiProperty({ description: 'User email address' })
  @Column({ name: 'EMA_USR', length: 255, nullable: true })
  email?: string;

  @ApiProperty({ description: 'Hashed password' })
  @Column({ name: 'PAS_HASH', length: 255 })
  passwordHash!: string;

  @ApiProperty({ description: 'User role', default: 'ADMIN' })
  @Column({ name: 'ROL_USR', length: 30, default: 'ADMIN' })
  role!: string;

  @ApiProperty({ description: 'Whether the user is active', default: true })
  @Column({ name: 'ACT_USR', type: 'tinyint', default: 1 })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Soft delete timestamp' })
  @DeleteDateColumn({ name: 'DEL_AT' })
  deletedAt?: Date;
}
