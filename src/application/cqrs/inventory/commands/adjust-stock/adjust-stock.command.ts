import { AdjustStockDto } from '../../../../dto/stock/adjust-stock.dto';

export class AdjustStockCommand {
  constructor(
    public readonly productId: string,
    public readonly dto: AdjustStockDto,
  ) {}
}
