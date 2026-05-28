import { BadRequestException } from '@nestjs/common';
import { UpdateProductDto } from '../../../../dto/product/update-product.dto';

export class UpdateProductValidator {
  static validate(id: string, payload?: UpdateProductDto): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Product id is required');
    }
    if (payload?.code !== undefined && payload.code.trim().length > 0) {
      throw new BadRequestException('Product code cannot be updated');
    }
    return id;
  }
}
