import { BadRequestException } from '@nestjs/common';
export class ActivateUserValidator {
  static validate(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }
  }
}