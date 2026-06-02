/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { QueryRunner } from 'typeorm';
import { InvoiceItemLot } from '../../../../domain/entities';
import type { IInvoiceItemLotRepository } from '../../../../domain/repositories';

export class InvoiceItemLotRepositoryImpl implements IInvoiceItemLotRepository {
  constructor(private readonly qr: QueryRunner) {}

  async createMany(records: InvoiceItemLot[]): Promise<InvoiceItemLot[]> {
    const entities = records.map((record) =>
      this.qr.manager.create('InvoiceItemLotTypeOrmEntity', this.mapToEntity(record)),
    );
    const saved = await this.qr.manager.save('InvoiceItemLotTypeOrmEntity', entities);
    return (Array.isArray(saved) ? saved : [saved]).map((entity: any) => this.mapToDomain(entity));
  }

  async findByInvoiceItemId(invoiceItemId: string): Promise<InvoiceItemLot[]> {
    const entities = await this.qr.manager
      .createQueryBuilder('InvoiceItemLotTypeOrmEntity', 'record')
      .leftJoinAndSelect('record.lot', 'lot')
      .where('record.invoiceItemId = :invoiceItemId', { invoiceItemId })
      .orderBy('record.createdAt', 'ASC')
      .getMany();
    return entities.map((entity: any) => this.mapToDomain(entity));
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItemLot[]> {
    const entities = await this.qr.manager
      .createQueryBuilder('InvoiceItemLotTypeOrmEntity', 'record')
      .leftJoinAndSelect('record.lot', 'lot')
      .leftJoin('record.invoiceItem', 'item')
      .where('item.invoiceId = :invoiceId', { invoiceId })
      .orderBy('record.createdAt', 'ASC')
      .getMany();
    return entities.map((entity: any) => this.mapToDomain(entity));
  }

  async deleteByInvoiceId(invoiceId: string): Promise<void> {
    // Get invoice item IDs for this invoice
    const invoiceItems = await this.qr.manager
      .createQueryBuilder()
      .select('item.id', 'id')
      .from('InvoiceItemTypeOrmEntity', 'item')
      .where('item.invoiceId = :invoiceId', { invoiceId })
      .getRawMany();

    const invoiceItemIds = invoiceItems.map((row: any) => row.id);
    if (invoiceItemIds.length === 0) return;

    await this.qr.manager
      .createQueryBuilder()
      .delete()
      .from('InvoiceItemLotTypeOrmEntity')
      .where('invoiceItemId IN (:...invoiceItemIds)', { invoiceItemIds })
      .execute();
  }

  private mapToDomain(entity: any): InvoiceItemLot {
    return new InvoiceItemLot({
      id: String(entity.id),
      invoiceItemId: entity.invoiceItemId,
      lotId: entity.lotId,
      lotCode: entity.lot?.lotCode,
      quantityUsed: Number(entity.quantityUsed),
      unitCostSnapshot: Number(entity.unitCostSnapshot),
      profitAmount: Number(entity.profitAmount),
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(record: InvoiceItemLot): any {
    return {
      id: record.id,
      invoiceItemId: record.invoiceItemId,
      lotId: record.lotId,
      quantityUsed: record.quantityUsed,
      unitCostSnapshot: record.unitCostSnapshot,
      profitAmount: record.profitAmount,
    };
  }
}
