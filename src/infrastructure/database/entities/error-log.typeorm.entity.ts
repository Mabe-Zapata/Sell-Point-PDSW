import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExceptionTypeDb } from './enums/exception-type.db-enum';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('ERROR_LOGS')
export class ErrorLogTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'EXC_TYP',
    type: 'enum',
    enum: ExceptionTypeDb,
  })
  exceptionType!: ExceptionTypeDb;

  @Column({ name: 'MES_ERR', type: 'text' })
  message!: string;

  @Column({ name: 'STA_TRA', type: 'text', nullable: true })
  stackTrace?: string;

  @Column({ name: 'SRC_ERR', length: 100, nullable: true })
  source?: string;

  @Column({ name: 'SRC_SCR_ERR', length: 100, nullable: true })
  sourceScreen?: string;

  @Column({ name: 'SRC_EVT_ERR', length: 100, nullable: true })
  sourceEvent?: string;

  @Column({ name: 'USR_ID', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => UserTypeOrmEntity, { nullable: true })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserTypeOrmEntity;

  @Index('IDX_ERR_LOG_CREATED_AT')
  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}