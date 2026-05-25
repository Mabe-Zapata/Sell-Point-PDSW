import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class GetRoleValidator {
  validate(roleId: string): void {
    if (!roleId || roleId.trim().length === 0) {
      throw new BadRequestException('Role ID is required');
    }
  }
}