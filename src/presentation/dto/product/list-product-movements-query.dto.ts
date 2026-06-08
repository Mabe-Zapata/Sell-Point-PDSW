import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../pagination/pagination-query.dto';

/**
 * Query DTO for the `GET /products/:id/movements` endpoint.
 *
 * The global `ValidationPipe` in `main.ts` is configured with
 * `whitelist: true, forbidNonWhitelisted: true`, which means any query
 * parameter that is NOT declared on a DTO that NestJS can validate
 * against is rejected with 400 ("property X should not exist"). The
 * `findMovements` controller method takes `@Query('type')` as an
 * individual `@Query()` param, but `type` is not part of the base
 * `PaginationQueryDto` whitelist, so a request like
 * `GET /products/:id/movements?page=1&limit=5&type=IN` was failing.
 *
 * This DTO extends `PaginationQueryDto` and declares the additional
 * optional `type` field so it is part of the validation whitelist.
 * The controller now takes a single
 * `@Query() query: ListProductMovementsQueryDto` argument and reads
 * each field off the resulting DTO.
 */
export class ListProductMovementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by movement type (IN, OUT, ADJUSTMENT, ...)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'type debe ser un texto' })
  @MaxLength(50, { message: 'type no puede tener más de 50 caracteres' })
  type?: string;
}
