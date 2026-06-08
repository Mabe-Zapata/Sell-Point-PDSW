import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../application/ports/password-hasher.interface';

export class PasswordHasher implements IPasswordHasher {
  private static readonly SALT_ROUNDS = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, PasswordHasher.SALT_ROUNDS);
  }
}
