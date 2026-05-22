import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserStatusDb {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

@Entity('ROLES')
export class RoleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'NAM_ROL', length: 50, unique: true })
  name!: string;

  @Column({ name: 'DES_ROL', type: 'varchar', length: 255, nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}