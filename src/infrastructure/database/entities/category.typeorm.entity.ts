import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('CATEGORIES')
export class CategoryTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'NAM_CAT', length: 100 })
  name!: string;

  @Column({ name: 'DES_CAT', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'ACT_CAT', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}