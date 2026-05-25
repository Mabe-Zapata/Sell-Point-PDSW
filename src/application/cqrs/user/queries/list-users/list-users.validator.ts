import { Injectable, BadRequestException } from '@nestjs/common';
import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

@Injectable()
export class ListUsersValidator {
  validate(pagination: PaginationParams): void {
    if (pagination.page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }
    if (pagination.limit < 1 || pagination.limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
  }
}