import { BadRequestException } from '@nestjs/common';
export class GetProductValidator {
  static validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Product id is required');
    }
    return id;
  }
}
