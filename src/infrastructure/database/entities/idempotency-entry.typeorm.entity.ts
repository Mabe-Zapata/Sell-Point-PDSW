import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { dbLongTextColumn } from './db-column.helper';

@Entity('IDEMPOTENCY_KEYS')
export class IdempotencyEntryTypeOrmEntity {
  @PrimaryColumn({ name: 'IDP_KEY', length: 255 })
  key!: string;

  @Column({ name: 'IDP_RES', ...dbLongTextColumn(true) })
  response?: string;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}
