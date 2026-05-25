import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface IPasswordResetTokenRepository {
  create(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByHash(hash: string): Promise<PasswordResetToken | null>;
  findAll(pagination: PaginationParams, filters?: { userId?: string }): Promise<PaginatedResult<PasswordResetToken>>;
  markAsUsed(id: string): Promise<void>;
}
