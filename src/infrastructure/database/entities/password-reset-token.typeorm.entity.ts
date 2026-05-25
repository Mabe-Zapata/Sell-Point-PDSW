import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { dbLongTextColumn } from './db-column.helper';

@Entity('PASSWORD_RESET_TOKENS')
export class PasswordResetTokenTypeOrmEntity {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  id!: string;

  @Column({ name: 'USER_ID', type: 'uuid' })
  userId!: string;

  @Column({ name: 'TOKEN_HASH', length: 64 })
  tokenHash!: string;

  @Column({ name: 'EXPIRES_AT', type: 'timestamp', precision: 6 })
  expiresAt!: Date;

  @Column({ name: 'USED_AT', type: 'timestamp', precision: 6, nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'CRE_AT' })
  createdAt!: Date;
}
