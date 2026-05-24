export class GetStockLevelsQuery {
  constructor(
    public readonly warehouseId?: string,
    public readonly productId?: string,
  ) {}
}