import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../pagination/pagination-query.dto';

/**
 * Query DTO for the `GET /sales` endpoint.
 *
 * The global `ValidationPipe` in `main.ts` is configured with
 * `whitelist: true, forbidNonWhitelisted: true`, which means any query
 * parameter that is NOT declared on a DTO that NestJS can validate
 * against is rejected with 400 ("property X should not exist"). The
 * `findAll` controller method takes `@Query('q')` etc. as individual
 * `@Query()` params, but those are not part of any DTO's whitelist, so
 * a request like `GET /sales?page=1&limit=5&q=001` was failing.
 *
 * This DTO extends `PaginationQueryDto` and declares the additional
 * optional filter fields (q, customerId, status, createdFrom,
 * createdTo) so they are part of the validation whitelist. The
 * controller now takes a single `@Query() query: ListSalesQueryDto`
 * argument and reads each field off the resulting DTO.
 */
export class ListSalesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Free-text search across sale number and customer name',
    maxLength: 100,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'q debe ser un texto' })
  @MaxLength(100, { message: 'q no puede tener más de 100 caracteres' })
  @Transform(
    ({ value }: { value: unknown }): string | undefined =>
      typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined,
    { toClassOnly: true },
  )
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'customerId debe ser un texto' })
  @MaxLength(50, { message: 'customerId no puede tener más de 50 caracteres' })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by sale status (DRAFT, CONFIRMED, CANCELLED)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'status debe ser un texto' })
  @MaxLength(50, { message: 'status no puede tener más de 50 caracteres' })
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date from (ISO 8601)',
    type: String,
  })
  @IsOptional()
  @IsISO8601({}, { message: 'createdFrom debe ser una fecha ISO 8601' })
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date to (ISO 8601)',
    type: String,
  })
  @IsOptional()
  @IsISO8601({}, { message: 'createdTo debe ser una fecha ISO 8601' })
  createdTo?: string;
}
