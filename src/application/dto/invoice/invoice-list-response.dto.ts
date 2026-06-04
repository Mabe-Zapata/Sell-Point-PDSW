export class InvoiceListResponseDto {
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
  customerName: string;
  customerCedula: string;
  customerEmail?: string;
  // branchName removed — branch entity deleted (simplify-schema-uta SDD)
  subtotal: number;
  iva: number;
  total: number;
  establishmentCode: string;
  emissionPointCode: string;
  cashierName?: string;
  cashierUsername?: string;
  cashierEmployeeId?: string;
  customerNameSnapshot?: string;
  customerCedulaSnapshot?: string;
  customerEmailSnapshot?: string;
  cashierNameSnapshot?: string;
  cashierUsernameSnapshot?: string;
  cashierEmployeeIdSnapshot?: string;

  constructor(data: {
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
    customerName: string;
    customerCedula: string;
    customerEmail?: string;
    subtotal: number;
    iva: number;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
    cashierName?: string;
    cashierUsername?: string;
    cashierEmployeeId?: string;
    customerNameSnapshot?: string;
    customerCedulaSnapshot?: string;
    customerEmailSnapshot?: string;
    cashierNameSnapshot?: string;
    cashierUsernameSnapshot?: string;
    cashierEmployeeIdSnapshot?: string;
  }) {
    this.id = data.id;
    this.saleId = data.saleId;
    this.seriesId = data.seriesId;
    this.invoiceNumber = data.invoiceNumber;
    this.authorizationNumber = data.authorizationNumber;
    this.issueDate = data.issueDate;
    this.status = data.status;
    this.cancelledAt = data.cancelledAt;
    this.createdAt = data.createdAt;
    this.saleNumber = data.saleNumber;
    this.customerName = data.customerName;
    this.customerCedula = data.customerCedula;
    this.customerEmail = data.customerEmail;
    this.subtotal = data.subtotal;
    this.iva = data.iva;
    this.total = data.total;
    this.establishmentCode = data.establishmentCode;
    this.emissionPointCode = data.emissionPointCode;
    this.cashierName = data.cashierName;
    this.cashierUsername = data.cashierUsername;
    this.cashierEmployeeId = data.cashierEmployeeId;
    this.customerNameSnapshot = data.customerNameSnapshot;
    this.customerCedulaSnapshot = data.customerCedulaSnapshot;
    this.customerEmailSnapshot = data.customerEmailSnapshot;
    this.cashierNameSnapshot = data.cashierNameSnapshot;
    this.cashierUsernameSnapshot = data.cashierUsernameSnapshot;
    this.cashierEmployeeIdSnapshot = data.cashierEmployeeIdSnapshot;
  }

  static fromQueryResult(result: {
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
    customerName: string;
    customerCedula: string;
    customerEmail?: string;
    subtotal: number;
    iva: number;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
    cashierName?: string;
    cashierUsername?: string;
    cashierEmployeeId?: string;
    customerNameSnapshot?: string;
    customerCedulaSnapshot?: string;
    customerEmailSnapshot?: string;
    cashierNameSnapshot?: string;
    cashierUsernameSnapshot?: string;
    cashierEmployeeIdSnapshot?: string;
  }): InvoiceListResponseDto {
    return new InvoiceListResponseDto(result);
  }

  static fromQueryResults(results: {
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
    customerName: string;
    customerCedula: string;
    customerEmail?: string;
    subtotal: number;
    iva: number;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
    cashierName?: string;
    cashierUsername?: string;
    cashierEmployeeId?: string;
    customerNameSnapshot?: string;
    customerCedulaSnapshot?: string;
    customerEmailSnapshot?: string;
    cashierNameSnapshot?: string;
    cashierUsernameSnapshot?: string;
    cashierEmployeeIdSnapshot?: string;
  }[]): InvoiceListResponseDto[] {
    return results.map((r) => InvoiceListResponseDto.fromQueryResult(r));
  }
}
