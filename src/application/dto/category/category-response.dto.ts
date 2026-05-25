import { Category } from '../../../domain/entities/category.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Beverages' })
  name: string;

  @ApiProperty({ description: 'Category description', example: 'Soda and juices', required: false })
  description?: string;

  @ApiProperty({ description: 'Active status', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
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
