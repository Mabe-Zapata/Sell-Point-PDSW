export class ProductWithStockResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean;

  constructor(data: {
    id: string;
    code: string;
    name: string;
    description?: string;
    salePrice: number;
    costPrice: number;
    currentStock: number;
    categoryId: string;
    categoryName: string;
    isActive: boolean;
  }) {
    this.id = data.id;
    this.code = data.code;
    this.name = data.name;
    this.description = data.description;
    this.salePrice = data.salePrice;
    this.costPrice = data.costPrice;
    this.currentStock = data.currentStock;
    this.categoryId = data.categoryId;
    this.categoryName = data.categoryName;
    this.isActive = data.isActive;
  }

  static fromQueryResult(result: {
    id: string;
    code: string;
    name: string;
    salePrice: number;
    costPrice: number;
    currentStock: number;
    categoryId: string;
    categoryName: string;
    isActive: boolean;
  }): ProductWithStockResponseDto {
    return new ProductWithStockResponseDto(result);
  }

  static fromQueryResults(results: {
    id: string;
    code: string;
    name: string;
    salePrice: number;
    costPrice: number;
    currentStock: number;
    categoryId: string;
    categoryName: string;
    isActive: boolean;
  }[]): ProductWithStockResponseDto[] {
    return results.map((r) => ProductWithStockResponseDto.fromQueryResult(r));
  }
}