import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ActivateUserValidator {
  validate(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }
  }
}