import { BadRequestException } from '@nestjs/common';
export class UpdateProductValidator {
  static validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Product id is required');
    }
    return id;
  }
}
