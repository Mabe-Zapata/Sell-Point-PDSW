import { ListInvoicesQuery } from './list-invoices.query';
import type {
  IInvoiceQueryService,
  InvoiceListItem,
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

    const [headers, total] = await Promise.all([
      this.invoiceQueryService.listInvoiceHeaders({
        branchId: filters.branchId ?? null,
        customerId: filters.customerId ?? null,
        status: filters.status ?? null,
        invoiceNumber: filters.invoiceNumber ?? null,
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
        limit,
        offset,
      }),
      this.invoiceQueryService.countInvoiceHeaders({
        branchId: filters.branchId ?? null,
        customerId: filters.customerId ?? null,
        status: filters.status ?? null,
        invoiceNumber: filters.invoiceNumber ?? null,
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
      }),
    ]);

    if (!headers.length) {
      return { data: [], total, page, limit };
    }

    const invoiceIds = headers.map(h => h.id);

    const totals = await this.invoiceQueryService.listInvoiceTotals(invoiceIds);
    const totalsByInvoice = new Map(totals.map(t => [t.invoiceId, t]));

    const data: InvoiceListItem[] = headers.map(header => {
      const totalResult = totalsByInvoice.get(header.id);
      const subtotal = Number(totalResult?.subtotal ?? 0);
      const iva = Number(totalResult?.iva ?? 0);
      const total = subtotal + iva;
      const issueDate = header.issueDate instanceof Date
        ? header.issueDate
        : new Date(header.issueDate);
      const createdAt = header.createdAt instanceof Date
        ? header.createdAt
        : new Date(header.createdAt);
      const cancelledAt = header.cancelledAt
        ? (header.cancelledAt instanceof Date ? header.cancelledAt : new Date(header.cancelledAt))
        : null;

      return {
        id: header.id,
        saleId: header.saleId,
        seriesId: header.seriesId,
        invoiceNumber: header.invoiceNumber,
        authorizationNumber: header.authorizationNumber,
        issueDate,
        status: header.status,
        cancelledAt,
        createdAt,
        saleNumber: header.saleNumber,
        customerId: header.customerId,
        customerName: header.customerName,
        customerCedula: header.customerCedula,
        customerEmail: header.customerEmail,
        subtotal,
        iva,
        total,
        establishmentCode: header.establishmentCode,
        emissionPointCode: header.emissionPointCode,
        cashierName: header.cashierName,
        cashierUsername: header.cashierUsername,
        cashierEmployeeId: header.cashierEmployeeId,
        cashierUserId: header.cashierUserId,
        customerNameSnapshot: header.customerNameSnapshot,
        customerCedulaSnapshot: header.customerCedulaSnapshot,
        customerEmailSnapshot: header.customerEmailSnapshot,
        cashierNameSnapshot: header.cashierNameSnapshot,
        cashierUsernameSnapshot: header.cashierUsernameSnapshot,
        cashierEmployeeIdSnapshot: header.cashierEmployeeIdSnapshot,
      };
    });

    return { data, total, page, limit };
  }
}
