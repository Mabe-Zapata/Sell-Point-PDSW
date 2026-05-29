import { InvoiceSeries } from '../../../domain/entities';

export class InvoiceSeriesResponseDto {
  id: string;
  branchId: string;
  establishmentCode: string;
  emissionPointCode: string;
  currentSequence: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(series: InvoiceSeries) {
    this.id = series.id;
    this.branchId = series.branchId;
    this.establishmentCode = series.establishmentCode;
    this.emissionPointCode = series.emissionPointCode;
    this.currentSequence = series.currentSequence;
    this.isActive = series.isActive;
    this.createdAt = series.createdAt;
    this.updatedAt = series.updatedAt;
  }

  static fromEntity(series: InvoiceSeries): InvoiceSeriesResponseDto {
    return new InvoiceSeriesResponseDto(series);
  }

  static fromEntities(series: InvoiceSeries[]): InvoiceSeriesResponseDto[] {
    return series.map((item) => new InvoiceSeriesResponseDto(item));
  }
}
