import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../pagination/pagination-query.dto';

/**
 * Query DTO for the `GET /invoice-series` endpoint.
 *
 * The global `ValidationPipe` in `main.ts` is configured with
 * `whitelist: true, forbidNonWhitelisted: true`, which means any query
 * parameter that is NOT declared on a DTO that NestJS can validate
 * against is rejected with 400 ("property X should not exist"). The
 * `findAll` controller method takes `@Query('branchId')` etc. as
 * individual `@Query()` params, but those are not part of any DTO's
 * whitelist, so a request like
 * `GET /invoice-series?page=1&limit=5&branchId=abc` was failing.
 *
 * This DTO extends `PaginationQueryDto` and declares the additional
 * optional filter fields (branchId, isActive) so they are part of the
 * validation whitelist. The controller now takes a single
 * `@Query() query: ListInvoiceSeriesQueryDto` argument and reads each
 * field off the resulting DTO.
 */
export class ListInvoiceSeriesQueryDto extends PaginationQueryDto {
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
    description: 'Filter by active status (true / false)',
    type: String,
  })
  @IsOptional()
  @IsBooleanString({ message: 'isActive debe ser "true" o "false"' })
  isActive?: string;
}
