import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';

export interface SessionPayload {
  id: string;
  employeeId: string;
  role: string;
  email?: string;
}

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Hash a plain-text password using bcrypt (salt is embedded in the hash).
   * Use this when creating or updating a user's password.
   */
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.SALT_ROUNDS);
  }

  /**
   * Verify a plain-text password against a bcrypt hash stored in PAS_HASH.
   */
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Authenticate a user by EMP_ID + password.
   * Returns a session payload on success, null on failure.
   */
  async login(
    employeeId: string,
    password: string,
  ): Promise<SessionPayload | null> {
    const user = await this.userRepository.findByEmployeeId(employeeId);
    if (!user) return null;

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      employeeId: user.employeeId,
      role: user.role,
      email: user.email ?? undefined,
    };
  }
}
