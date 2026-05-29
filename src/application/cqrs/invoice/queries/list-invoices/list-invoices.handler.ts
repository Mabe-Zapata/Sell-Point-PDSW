import { ListInvoicesQuery } from './list-invoices.query';
import type {
  IInvoiceQueryService,
  InvoiceListItem,
  InvoiceHeaderResult,
} from '../../../../../domain/query-services/invoice.query-service.interface';
import type { PaginatedResult } from '../../../../../domain/repositories/pagination.types';

export class ListInvoicesHandler {
  constructor(
    private readonly invoiceQueryService: IInvoiceQueryService,
  ) {}

  async execute(query: ListInvoicesQuery): Promise<PaginatedResult<InvoiceListItem>> {
    const { page, limit } = query.pagination;
    const filters = query.filters ?? {};
    const offset = (page - 1) * limit;

    // Query A: Get headers
    const headers = await this.invoiceQueryService.listInvoiceHeaders(
      filters.customerId ?? null,
      filters.startDate ?? null,
      filters.endDate ?? null,
      limit,
      offset,
    );

    if (!headers.length) {
      return { data: [], total: 0, page, limit };
    }

    const invoiceIds = headers.map(h => h.id);

    // Query B and Query C in parallel
    const [items, totals] = await Promise.all([
      this.invoiceQueryService.listInvoiceItems(invoiceIds),
      this.invoiceQueryService.listInvoiceTotals(invoiceIds),
    ]);

    // In-memory join
    const itemsByInvoice = groupBy(items, 'invoiceId');
    const totalsByInvoice = new Map(totals.map(t => [t.invoiceId, t]));

    const data: InvoiceListItem[] = headers.map(header => {
      const itemResults = itemsByInvoice.get(header.id) ?? [];
      const totalResult = totalsByInvoice.get(header.id);

      return {
        id: header.id,
        saleId: '', // Not needed for list view
        seriesId: '', // Not needed for list view
        invoiceNumber: header.invoiceNumber,
        authorizationNumber: null,
        issueDate: header.createdAt,
        status: '', // Not needed for list view
        cancelledAt: null,
        createdAt: header.createdAt,
        saleNumber: '', // Not needed for list view
        customerName: header.customerName,
        customerCedula: '',
        subtotal: totalResult?.subtotal ?? 0,
        iva: totalResult?.iva ?? 0,
        total: header.totalAmount,
        establishmentCode: '',
        emissionPointCode: '',
        items: itemResults.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };
    });

    return { data, total: data.length, page, limit };
  }
}

function groupBy<T>(arr: T[], key: keyof T): Map<string, T[]> {
  return arr.reduce((map, item) => {
    const k = String(item[key]);
    const group = map.get(k) ?? [];
    group.push(item);
    map.set(k, group);
    return map;
  }, new Map<string, T[]>());
}