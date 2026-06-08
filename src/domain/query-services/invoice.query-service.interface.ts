export interface InvoiceListItem {
  id: string;
  saleId: string;
  seriesId: string;
  invoiceNumber: string;
  authorizationNumber: string | null;
  issueDate: Date;
  status: string;
  cancelledAt: Date | null;
  createdAt: Date;
  saleNumber: string;
  customerId?: string;
  customerName: string;
  customerCedula: string;
  customerEmail?: string;
  subtotal: number;
  iva: number;
  // branchName removed — branch entity deleted (simplify-schema-uta SDD)
  total: number;
  establishmentCode: string;
  emissionPointCode: string;
  // Audit snapshots (nullable — old invoices won't have them)
  // Resolved values (COALESCE: snapshot > live JOIN)
  cashierUserId?: string;
  cashierName?: string;
  cashierUsername?: string;
  cashierEmployeeId?: string;
  // Raw snapshot values
  customerNameSnapshot?: string;
  customerCedulaSnapshot?: string;
  customerEmailSnapshot?: string;
  cashierNameSnapshot?: string;
  cashierUsernameSnapshot?: string;
  cashierEmployeeIdSnapshot?: string;
}

export interface InvoiceKpis {
  totalInvoiced: number;
  issuedCount: number;
  cancelledTotal: number;
  cancelledCount: number;
  last30DaysTotal: number;
  last30DaysCount: number;
}

export interface InvoiceHeaderResult {
  id: string;
  saleId: string;
  seriesId: string;
  invoiceNumber: string;
  authorizationNumber: string | null;
  issueDate: Date;
  status: string;
  cancelledAt: Date | null;
  createdAt: Date;
  saleNumber: string;
  customerId?: string;
  customerName: string;
  customerCedula: string;
  customerEmail?: string;
  totalAmount: number;
  establishmentCode: string;
  emissionPointCode: string;
  cashierUserId?: string;
  cashierName?: string;
  cashierUsername?: string;
  cashierEmployeeId?: string;
  customerNameSnapshot?: string;
  customerCedulaSnapshot?: string;
  customerEmailSnapshot?: string;
  cashierNameSnapshot?: string;
  cashierUsernameSnapshot?: string;
  cashierEmployeeIdSnapshot?: string;
}

export interface InvoiceItemResult {
  id: string;
  invoiceId: string;
  quantity: number;
  price: number;
  productName: string;
  productNameSnapshot?: string;
  taxPercentage?: number;
  taxAmount?: number;
}

export interface InvoiceTotalResult {
  invoiceId: string;
  subtotal: number;
  iva: number;
}

export interface IInvoiceQueryService {
  getInvoiceById(id: string): Promise<InvoiceListItem | null>;
  getInvoiceBySaleId(saleId: string): Promise<InvoiceListItem | null>;
  getInvoiceKpis(params?: { branchId?: string }): Promise<InvoiceKpis>;

  // Split query methods for performance
  listInvoiceHeaders(params: {
    branchId?: string | null;
    customerId?: string | null;
    status?: string | null;
    invoiceNumber?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    limit: number;
    offset: number;
  }): Promise<InvoiceHeaderResult[]>;

  countInvoiceHeaders(params: {
    branchId?: string | null;
    customerId?: string | null;
    status?: string | null;
    invoiceNumber?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }): Promise<number>;

  listInvoiceItems(invoiceIds: string[]): Promise<InvoiceItemResult[]>;
  listInvoiceTotals(invoiceIds: string[]): Promise<InvoiceTotalResult[]>;
}
