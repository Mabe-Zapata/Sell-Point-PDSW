import { PasswordResetToken } from '../entities/password-reset-token.entity';

export interface IPasswordResetTokenRepository {
  create(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByHash(hash: string): Promise<PasswordResetToken | null>;
  markAsUsed(id: string): Promise<void>;
}
