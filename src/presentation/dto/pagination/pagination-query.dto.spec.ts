import { validate } from 'class-validator';
import { plainToClass, plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  describe('validation', () => {
    it('should pass with valid default values', async () => {
      const dto = plainToClass(PaginationQueryDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with page=1 and limit=20', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 20 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with limit=100 (max allowed)', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 100 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail when page=0', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 0, limit: 20 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
      expect(errors[0].constraints['min']).toBe('La página debe ser mayor o igual a 1');
    });

    it('should fail when page is negative', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: -1, limit: 20 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail when limit=0', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
      expect(errors[0].constraints['min']).toBe('El límite debe ser mayor o igual a 1');
    });

    it('should fail when limit=-1', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: -1 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail when limit=101 (> 100)', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
      expect(errors[0].constraints['max']).toBe('El límite máximo por página es 100');
    });

    it('should fail when limit=10000', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 10000 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should pass when limit=100 exactly', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: 1, limit: 100 });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should use default values when not provided (plainToClass)', async () => {
      const dto = plainToClass(PaginationQueryDto, {});
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(25);
    });

    // Mirrors the NestJS ValidationPipe flow (plainToInstance, the
    // modern class-transformer API). This is the path the e2e suite
    // exercises, so the default must hold there too.
    it('should use default values when not provided (plainToInstance — ValidationPipe path)', async () => {
      const dto = plainToInstance(PaginationQueryDto, {});
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(25);
    });

    it('should apply the default when limit is omitted from the query', async () => {
      // Mirrors GET /products — no `limit` param at all. The @Transform
      // catches the undefined value that class-transformer would otherwise
      // leave on the DTO and re-applies the documented default of 25.
      const dto = plainToInstance(PaginationQueryDto, {});
      expect(dto.limit).toBe(25);
    });
  });

  describe('transform', () => {
    it('should transform string values to numbers', async () => {
      const dto = plainToClass(PaginationQueryDto, { page: '5', limit: '50' });
      // class-transformer convierte los strings a números por el @Type(() => Number)
      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(50);
    });
  });
});