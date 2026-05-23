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
  customerIdentificationNumber: string;
  branchName: string;
  total: number;
  establishmentCode: string;
  emissionPointCode: string;

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
    customerIdentificationNumber: string;
    branchName: string;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
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
    this.customerIdentificationNumber = data.customerIdentificationNumber;
    this.branchName = data.branchName;
    this.total = data.total;
    this.establishmentCode = data.establishmentCode;
    this.emissionPointCode = data.emissionPointCode;
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
    customerIdentificationNumber: string;
    branchName: string;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
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
    customerIdentificationNumber: string;
    branchName: string;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
  }[]): InvoiceListResponseDto[] {
    return results.map((r) => InvoiceListResponseDto.fromQueryResult(r));
  }
}