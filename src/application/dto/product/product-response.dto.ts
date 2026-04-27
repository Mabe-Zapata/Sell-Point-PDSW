import { Product } from '../../../domain/entities/product.entity';

export class ProductResponseDto {
  id: string;

  code: string;

  name: string;

  description?: string;

  unitPrice: number;

  price: number;

  availableQuantity: number;

  createdAt: Date;

  updatedAt: Date;

  constructor(product: Product) {
    this.id = product.id;
    this.code = product.code;
    this.name = product.name;
    this.description = product.description;
    this.unitPrice = product.unitPrice;
    this.price = product.unitPrice;
    this.availableQuantity = product.availableQuantity;
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
