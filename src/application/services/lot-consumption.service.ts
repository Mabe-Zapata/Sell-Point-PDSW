import { randomUUID } from 'crypto';
import { InvoiceItem, InvoiceItemLot, StockMovement, StockMovementType } from '../../domain/entities';
import type {
  IInvoiceItemLotRepository,
  ILotRepository,
  IProductRepository,
  IStockMovementRepository,
} from '../../domain/repositories';
import { BusinessRuleException, InsufficientStockException } from '../../domain/exceptions';

export interface LotConsumptionResult {
  profitTotal: number;
  lotCodesByInvoiceItemId: Map<string, string[]>;
}

export class LotConsumptionService {
  constructor(
    private readonly lots: ILotRepository,
    private readonly products: IProductRepository,
    private readonly invoiceItemLots: IInvoiceItemLotRepository,
    private readonly stockMovements?: IStockMovementRepository,
  ) {}

  async consumeInvoiceItems(
    items: InvoiceItem[],
    referenceId: string,
    userId?: string,
  ): Promise<LotConsumptionResult> {
    const records: InvoiceItemLot[] = [];
    const lotCodesByInvoiceItemId = new Map<string, string[]>();
    let profitTotal = 0;

    for (const item of items) {
      const product = await this.products.findByIdForUpdate(item.productId);
      if (!product) {
        throw new BusinessRuleException(`Product ${item.productId} not found`);
      }

      const currentStock = product.currentStock ?? 0;
      if (currentStock < item.quantity) {
        throw new InsufficientStockException(product.name, item.quantity, currentStock);
      }

      const activeLots = await this.lots.findActiveByProductIdForUpdate(item.productId);
      let remaining = item.quantity;
      let availableInLots = 0;
      const lotCodes: string[] = [];

      for (const lot of activeLots) {
        availableInLots += lot.quantityAvailable;
        if (remaining <= 0) break;
        if (lot.quantityAvailable <= 0) continue;

        const quantityUsed = Math.min(lot.quantityAvailable, remaining);
        const nextAvailable = Number((lot.quantityAvailable - quantityUsed).toFixed(3));
        const profitAmount = this.roundCurrency((item.unitPrice - lot.unitCost) * quantityUsed);

        await this.lots.setQuantityAvailable(lot.id, nextAvailable);

        records.push(new InvoiceItemLot({
          id: randomUUID(),
          invoiceItemId: item.id,
          lotId: lot.id,
          lotCode: lot.lotCode,
          quantityUsed,
          unitCostSnapshot: lot.unitCost,
          profitAmount,
        }));

        profitTotal = this.roundCurrency(profitTotal + profitAmount);
        remaining = Number((remaining - quantityUsed).toFixed(3));
        lotCodes.push(lot.lotCode);
      }

      if (remaining > 0) {
        throw new BusinessRuleException(
          `Insufficient lot stock for product ${product.name}. Available in lots: ${availableInLots}, requested: ${item.quantity}`,
        );
      }

      await this.products.decrementStock(item.productId, item.quantity);
      await this.stockMovements?.create(new StockMovement({
        productId: item.productId,
        type: StockMovementType.SALE,
        quantity: item.quantity,
        previousStock: currentStock,
        newStock: currentStock - item.quantity,
        userId,
        referenceType: 'SALE',
        referenceId,
        description: `Sale ${referenceId}`,
      }));

      lotCodesByInvoiceItemId.set(item.id, lotCodes);
    }

    if (records.length > 0) {
      await this.invoiceItemLots.createMany(records);
    }

    return { profitTotal, lotCodesByInvoiceItemId };
  }

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }
}
