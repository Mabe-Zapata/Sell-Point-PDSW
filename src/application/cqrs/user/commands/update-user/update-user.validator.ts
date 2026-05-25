import { Injectable, BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from '../../../../dto/user/update-user.dto';

@Injectable()
export class UpdateUserValidator {
  validate(userId: string, payload: UpdateUserDto): void {
    if (!userId || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }
    if (payload.email !== undefined && payload.email.trim().length === 0) {
      throw new BadRequestException('Email cannot be empty');
    }
    if (payload.firstName !== undefined && payload.firstName.trim().length === 0) {
      throw new BadRequestException('First name cannot be empty');
    }
    if (payload.lastName !== undefined && payload.lastName.trim().length === 0) {
      throw new BadRequestException('Last name cannot be empty');
    }
  }
}