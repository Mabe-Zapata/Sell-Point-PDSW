import { Category } from '../../../domain/entities/category.entity';

export class CategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  taxRateId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.taxRateId = category.taxRateId;
    this.isActive = category.isActive;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }

  static fromEntity(category: Category): CategoryResponseDto {
    return new CategoryResponseDto(category);
  }

  static fromEntities(categories: Category[]): CategoryResponseDto[] {
    return categories.map((c) => new CategoryResponseDto(c));
  }
}

