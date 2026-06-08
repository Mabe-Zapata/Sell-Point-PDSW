import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../pagination/pagination-query.dto';

/**
 * Query DTO for the `GET /invoices` endpoint.
 *
 * The global `ValidationPipe` in `main.ts` is configured with
 * `whitelist: true, forbidNonWhitelisted: true`, which means any query
 * parameter that is NOT declared on a DTO that NestJS can validate
 * against is rejected with 400 ("property X should not exist"). The
 * `findAll` controller method takes `@Query('branchId')` etc. as
 * individual `@Query()` params, but those are not part of any DTO's
 * whitelist, so a request like
 * `GET /invoices?page=1&limit=5&branchId=abc` was failing.
 *
 * This DTO extends `PaginationQueryDto` and declares the additional
 * optional filter fields (branchId, status, invoiceNumber, startDate,
 * endDate) so they are part of the validation whitelist. The controller
 * now takes a single `@Query() query: ListInvoicesQueryDto` argument
 * and reads each field off the resulting DTO.
 */
export class ListInvoicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by branch UUID',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'branchId debe ser un texto' })
  @MaxLength(50, { message: 'branchId no puede tener más de 50 caracteres' })
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice status (ISSUED, CANCELLED, ...)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'status debe ser un texto' })
  @MaxLength(50, { message: 'status no puede tener más de 50 caracteres' })
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice number',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'invoiceNumber debe ser un texto' })
  @MaxLength(50, { message: 'invoiceNumber no puede tener más de 50 caracteres' })
  invoiceNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by start date (ISO 8601)',
    type: String,
  })
  @IsOptional()
  @IsISO8601({}, { message: 'startDate debe ser una fecha ISO 8601' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO 8601)',
    type: String,
  })
  @IsOptional()
  @IsISO8601({}, { message: 'endDate debe ser una fecha ISO 8601' })
  endDate?: string;
}
