import { ResetPasswordDto } from '../../../../dto/auth/reset-password.dto';

export class ResetPasswordValidator {
  static validate(payload: ResetPasswordDto): void {
    if (!payload.token || payload.token.trim().length === 0) {
      throw new Error('Token is required');
    }

    if (!payload.newPassword || payload.newPassword.trim().length === 0) {
      throw new Error('New password is required');
    }

    if (payload.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (payload.newPassword !== payload.confirmPassword) {
      throw new Error('Passwords do not match');
    }
  }
}
