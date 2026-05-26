import { RequestPasswordResetDto } from '../../../../dto/auth/request-password-reset.dto';

export class RequestPasswordResetValidator {
  static validate(payload: RequestPasswordResetDto): void {
    if (!payload.email || payload.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      throw new Error('Invalid email format');
    }
  }
}
