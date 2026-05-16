import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of active customers' })
  totalClientes: number;

  @ApiProperty({ description: 'Total number of active products' })
  totalProductos: number;

  @ApiProperty({ description: 'Total number of active invoices' })
  totalFacturas: number;

  @ApiProperty({ description: 'Total sales amount for today' })
  ventasDelDia: number;

  @ApiProperty({ description: 'Total sales amount for the current month' })
  ventasDelMes: number;

  @ApiProperty({ description: 'Number of products with low stock' })
  productosConStockBajo: number;

  constructor(partial: Partial<DashboardStatsDto>) {
    Object.assign(this, partial);
  }
}