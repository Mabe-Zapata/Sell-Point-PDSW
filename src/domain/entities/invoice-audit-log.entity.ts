import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum InvoiceAuditAction {
  PRINT = 'PRINT',
  ALTER = 'ALTER',
  CANCEL = 'CANCEL',
  RESEND_EMAIL = 'RESEND_EMAIL',
  CREATE = 'CREATE',
}

@Entity('INVOICE_AUDIT_LOG')
@Index('IDX_INV_AUD_INV_ID', ['invoiceId'])
@Index('IDX_INV_AUD_USR_ID', ['userId'])
@Index('IDX_INV_AUD_ACT_TYP', ['actionType'])
export class InvoiceAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'INV_ID', type: 'uuid' })
  invoiceId!: string;

  @Column({ name: 'ACT_TYP', type: 'varchar', length: 30 })
  actionType!: InvoiceAuditAction;

  @Column({ name: 'USR_ID', type: 'varchar', length: 50 })
  userId!: string;

  @Column({ name: 'USR_NAM', type: 'varchar', length: 255 })
  userName!: string;

  @Column({ name: 'EMP_ID', type: 'varchar', length: 50, nullable: true })
  employeeId?: string;

  @Column({ name: 'DET_OLD', type: 'jsonb', nullable: true })
  detailsOld?: Record<string, unknown>;

  @Column({ name: 'DET_NEW', type: 'jsonb', nullable: true })
  detailsNew?: Record<string, unknown>;

  @Column({ name: 'IP_ADR', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'USE_AGT', type: 'varchar', length: 500, nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  constructor(partial: Partial<InvoiceAuditLog>) {
    Object.assign(this, partial);
  }
}
