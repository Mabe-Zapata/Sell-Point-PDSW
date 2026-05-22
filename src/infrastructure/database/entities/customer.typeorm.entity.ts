import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IdentificationTypeDb } from './enums/identification-type.db-enum';

@Entity('CUSTOMERS')
export class CustomerTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Legacy compatibility fields used by older seed/application code
  name?: string;

  lastName?: string;

  cedula?: string;

  @Column({
    name: 'IDT_TYP',
    type: 'enum',
    enum: IdentificationTypeDb,
  })
  identificationType!: IdentificationTypeDb;

  @Column({ name: 'IDT_NUM', length: 20, unique: true })
  identificationNumber!: string;

  @Column({ name: 'NAM_CUS', length: 255 })
  names!: string;

  @Column({ name: 'EMA_CUS', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'PHO_CUS', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'ADD_CUS', length: 255, nullable: true })
  address?: string;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'UPD_AT' })
  updatedAt!: Date;
}
