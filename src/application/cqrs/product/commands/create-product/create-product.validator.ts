import { Injectable, Inject } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '../../../../tokens';
import type { ICategoryRepository } from '../../../../../domain/repositories';
import { CreateProductDto } from '../../../../dto/product/create-product.dto';
import { EntityNotFoundException } from '../../../../../domain/exceptions';

@Injectable()
export class CreateProductValidator {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async validate(payload: CreateProductDto): Promise<void> {
    const category = await this.categoryRepository.findById(payload.categoryId);
    if (!category) {
      throw new EntityNotFoundException('Category', payload.categoryId);
    }
  }
}
