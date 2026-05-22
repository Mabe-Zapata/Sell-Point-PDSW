import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class GetProductValidator {
  validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Product id is required');
    }
    return id;
  }
}
