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
  // branchName removed — branch entity deleted (simplify-schema-uta SDD)
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
    customerCedula: string;
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
    this.customerCedula = data.customerCedula;
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
    customerCedula: string;
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
    customerCedula: string;
    total: number;
    establishmentCode: string;
    emissionPointCode: string;
  }[]): InvoiceListResponseDto[] {
    return results.map((r) => InvoiceListResponseDto.fromQueryResult(r));
  }
}