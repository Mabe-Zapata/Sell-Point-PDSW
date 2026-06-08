import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Min, Max } from 'class-validator';

export const PAGINATION_DEFAULT_LIMIT = 25;

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (minimum: 1)',
    default: 1,
    minimum: 1,
    type: Number,
  })
  @Type(() => Number)
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (minimum: 1, maximum: 100)',
    default: PAGINATION_DEFAULT_LIMIT,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @Type(() => Number)
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite máximo por página es 100' })
  @Transform(
    ({ value }) => {
      // The NestJS ValidationPipe (with `transform: true`) calls
      // class-transformer with the raw query object. When the param is
      // absent the value is `undefined`; the property initializer
      // (`= 25`) sets the default, but plainToInstance then overwrites it
      // with `undefined` from the plain object. This @Transform
      // re-applies the default for absent / null / empty values so the
      // documented behaviour holds at the wire layer — consumers can rely
      // on `limit=25` by default. (0 is left alone so an explicit
      // `?limit=0` still fails @Min(1) instead of silently defaulting.)
      if (value === undefined || value === null || value === '') {
        return PAGINATION_DEFAULT_LIMIT;
      }
      return value;
    },
    { toClassOnly: true },
  )
  limit?: number = PAGINATION_DEFAULT_LIMIT;
}
