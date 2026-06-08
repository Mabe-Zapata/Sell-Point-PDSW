import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index('IDX_AUDIT_LOGS_TABLE_NAME', ['tableName'])
@Index('IDX_AUDIT_LOGS_RECORD_ID', ['recordId'])
@Index('IDX_AUDIT_LOGS_USER_ID', ['userId'])
@Index('IDX_AUDIT_LOGS_CREATED_AT', ['createdAt'])
@Index('IDX_AUDIT_LOGS_ACTION', ['action'])
export class AuditLogTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'table_name', type: 'varchar', length: 128 })
  tableName!: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId!: string;

  @Column({ name: 'action', type: 'enum', enum: ['INSERT', 'UPDATE', 'DELETE'] })
  action!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'rol', type: 'varchar', length: 50, nullable: true })
  rol?: string;

  @Column({ name: 'changed_columns', type: 'jsonb', nullable: true })
  changedColumns?: string[];

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues?: Record<string, unknown>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues?: Record<string, unknown>;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
