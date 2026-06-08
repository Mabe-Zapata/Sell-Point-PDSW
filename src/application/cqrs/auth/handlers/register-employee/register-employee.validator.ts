import { RegisterEmployeeDto } from '../../../../dto/auth/register-employee.dto';

export class RegisterEmployeeValidator {
  static validate(payload: RegisterEmployeeDto): void {
    if (!payload.email || payload.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      throw new Error('Invalid email format');
    }
  }
}
