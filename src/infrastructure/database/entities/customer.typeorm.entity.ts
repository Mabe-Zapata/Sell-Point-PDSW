import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('CUSTOMERS')
export class CustomerTypeOrmEntity {
  @ApiProperty({ description: 'Customer unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Customer name' })
  @Column({ name: 'NAM_CUS', length: 100 })
  name!: string;

  @ApiProperty({ description: 'Customer last name' })
  @Column({ name: 'LAS_NAM_CUS', length: 100 })
  lastName!: string;

  @ApiProperty({ description: 'Customer identification number' })
  @Column({ name: 'ID_CUS', length: 20, unique: true })
  cedula!: string;

  @ApiProperty({ description: 'Customer email address' })
  @Column({ name: 'EMA_CUS', length: 255, nullable: true })
  email?: string;

  @ApiProperty({ description: 'Customer phone number' })
  @Column({ name: 'PHO_CUS', length: 20, nullable: true })
  phone?: string;

  @ApiProperty({ description: 'Customer address' })
  @Column({ name: 'ADD_CUS', length: 255, nullable: true })
  address?: string;

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
