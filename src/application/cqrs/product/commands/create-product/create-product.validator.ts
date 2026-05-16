import { Injectable } from '@nestjs/common';
import { CreateProductDto } from '../../../../dto/product/create-product.dto';

@Injectable()
export class CreateProductValidator {
  async validate(payload: CreateProductDto): Promise<void> {
    // No specific domain validation rules needed for create yet
  }
}
