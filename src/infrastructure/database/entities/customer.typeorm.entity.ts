import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('CUSTOMERS')
export class CustomerTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Legacy compatibility fields used by older seed/application code
  name?: string;

  lastName?: string;

  @Column({ name: 'CED_CUS', length: 20, nullable: true })
  cedula?: string;

  @Column({ name: 'NAM_CUS', length: 255 })
  names!: string;

  @Column({ name: 'EMA_CUS', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'PHO_CUS', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'ADD_CUS', length: 255, nullable: true })
  address?: string;

  @Column({ name: 'ACT_CUS', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
