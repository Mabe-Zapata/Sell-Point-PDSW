import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../pagination/pagination-query.dto';

/**
 * Query DTO for the `GET /auth/users` endpoint.
 *
 * The global `ValidationPipe` in `main.ts` is configured with
 * `whitelist: true, forbidNonWhitelisted: true`, which means any query
 * parameter that is NOT declared on a DTO that NestJS can validate
 * against is rejected with 400 ("property X should not exist"). The
 * `listUsers` controller method takes `@Query('q')` etc. as individual
 * `@Query()` params, but those are not part of any DTO's whitelist, so
 * a request like `GET /auth/users?page=1&limit=5&q=adm` was failing.
 *
 * This DTO extends `PaginationQueryDto` and declares the additional
 * optional filter fields (q, employeeId, username, email, role, status,
 * isActive) so they are part of the validation whitelist. The controller
 * now takes a single `@Query() query: ListUsersQueryDto` argument and
 * reads each field off the resulting DTO.
 */
export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Free-text search across employeeId, username and email',
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
    description: 'Filter by employeeId (exact match)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'employeeId debe ser un texto' })
  @MaxLength(50, { message: 'employeeId no puede tener más de 50 caracteres' })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by username (exact match)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'username debe ser un texto' })
  @MaxLength(50, { message: 'username no puede tener más de 50 caracteres' })
  username?: string;

  @ApiPropertyOptional({
    description: 'Filter by email (exact match)',
    maxLength: 254,
    type: String,
  })
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un email válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by role (e.g. ADMIN, CASHIER)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'role debe ser un texto' })
  @MaxLength(50, { message: 'role no puede tener más de 50 caracteres' })
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter by user status (ACTIVE, INACTIVE, BLOCKED)',
    maxLength: 50,
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'status debe ser un texto' })
  @MaxLength(50, { message: 'status no puede tener más de 50 caracteres' })
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status (true / false)',
    type: String,
  })
  @IsOptional()
  @IsBooleanString({ message: 'isActive debe ser "true" o "false"' })
  isActive?: string;
}
