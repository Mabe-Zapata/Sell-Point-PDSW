import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../pagination/pagination-query.dto';

/**
 * Query DTO for the `GET /error-logs` endpoint.
 *
 * The global `ValidationPipe` in `main.ts` is configured with
 * `whitelist: true, forbidNonWhitelisted: true`, which means any query
 * parameter that is NOT declared on a DTO that NestJS can validate
 * against is rejected with 400 ("property X should not exist"). The
 * `findAll` controller method takes `@Query('q')` etc. as individual
 * `@Query()` params, but those are not part of any DTO's whitelist, so
 * a request like `GET /error-logs?page=1&limit=5&q=foo` was failing.
 *
 * This DTO extends `PaginationQueryDto` and declares the additional
 * optional filter fields (q, exceptionType, userId) so they are part
 * of the validation whitelist. The controller now takes a single
 * `@Query() query: ListErrorLogsQueryDto` argument and reads each
 * field off the resulting DTO.
 */
export class ListErrorLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Free-text search across error message and stack trace',
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
    description: 'Filter by exception type (e.g. EntityNotFoundException)',
    maxLength: 100,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'exceptionType debe ser un texto' })
  @MaxLength(100, { message: 'exceptionType no puede tener más de 100 caracteres' })
  exceptionType?: string;

  @ApiPropertyOptional({
    description: 'Filter by user UUID who triggered the error',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'userId debe ser un texto' })
  @MaxLength(50, { message: 'userId no puede tener más de 50 caracteres' })
  userId?: string;
}
