import { BadRequestException } from '@nestjs/common';
import { CreateProductDto } from '../../../../dto/product/create-product.dto';

export class CreateProductValidator {
  static async validate(payload: CreateProductDto): Promise<void> {
    if (!payload.categoryId) {
      throw new BadRequestException('Category is required');
    }
    if (!payload.code || payload.code.trim().length === 0) {
      throw new BadRequestException('Product code is required');
    }
    if (!payload.name || payload.name.trim().length === 0) {
      throw new BadRequestException('Product name is required');
    }
    if (!payload.salePrice || payload.salePrice <= 0) {
      throw new BadRequestException('Sale price must be greater than 0');
    }
    if (!payload.costPrice || payload.costPrice <= 0) {
      throw new BadRequestException('Cost price must be greater than 0');
    }
  }
}
