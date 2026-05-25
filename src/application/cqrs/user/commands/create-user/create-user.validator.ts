import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../../../../dto/user/create-user.dto';

@Injectable()
export class CreateUserValidator {
  validate(payload: CreateUserDto): void {
    if (!payload.employeeId || payload.employeeId.trim().length === 0) {
      throw new BadRequestException('Employee ID is required');
    }
    if (!payload.username || payload.username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }
    if (!payload.email || payload.email.trim().length === 0) {
      throw new BadRequestException('Email is required');
    }
    if (!payload.password || payload.password.trim().length === 0) {
      throw new BadRequestException('Password is required');
    }
    if (payload.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }
}