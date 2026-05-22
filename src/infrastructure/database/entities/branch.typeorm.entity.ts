import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('BRANCHES')
export class BranchTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'NAM_BRA', length: 100 })
  name!: string;

  @Column({ name: 'CIT_BRA', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'ADD_BRA', length: 255, nullable: true })
  address?: string;

  @Column({ name: 'PHO_BRA', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'ACT_BRA', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}