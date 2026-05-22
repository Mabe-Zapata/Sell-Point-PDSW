import { Product } from '../../../domain/entities/product.entity';

export class ProductResponseDto {
  id: string;

  categoryId: string;

  code: string;

  name: string;

  description?: string;

  salePrice: number;

  costPrice: number;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  constructor(product: Product) {
    this.id = product.id;
    this.categoryId = product.categoryId;
    this.code = product.code;
    this.name = product.name;
    this.description = product.description;
    this.salePrice = product.salePrice;
    this.costPrice = product.costPrice;
    this.isActive = product.isActive;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }

  static fromEntity(product: Product): ProductResponseDto {
    return new ProductResponseDto(product);
  }

  static fromEntities(products: Product[]): ProductResponseDto[] {
    return products.map((product) => new ProductResponseDto(product));
  }
}
