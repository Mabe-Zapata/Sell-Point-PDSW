import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { dbLongTextColumn } from './db-column.helper';

export enum IdempotencyEntryStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('IDEMPOTENCY_KEYS')
export class IdempotencyEntryTypeOrmEntity {
  @PrimaryColumn({ name: 'IDP_KEY', length: 255 })
  key!: string;

  @Column({ name: 'IDP_RES', ...dbLongTextColumn(true) })
  response?: string;

  @Column({ name: 'REQ_HASH', length: 128, nullable: true })
  requestHash?: string;

  @Column({
    name: 'STATUS',
    length: 20,
    default: IdempotencyEntryStatus.IN_PROGRESS,
  })
  status!: IdempotencyEntryStatus;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;

  @Column({ name: 'UPD_AT', type: 'timestamp', nullable: true })
  updatedAt?: Date;
}
