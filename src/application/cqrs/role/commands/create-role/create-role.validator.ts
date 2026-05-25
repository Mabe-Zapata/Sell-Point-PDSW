import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateRoleDto } from '../../../../dto/role/create-role.dto';

@Injectable()
export class CreateRoleValidator {
  validate(payload: CreateRoleDto): void {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new BadRequestException('Role name is required');
    }
    if (payload.name.length > 50) {
      throw new BadRequestException('Role name must be at most 50 characters');
    }
  }
}