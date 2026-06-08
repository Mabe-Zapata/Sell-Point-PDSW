import { firstValueFrom, of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { PaginationInterceptor } from './pagination.interceptor';

type PaginatedPayload<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

function makeContext(): ExecutionContext {
  return {} as ExecutionContext;
}

function makeCallHandler<T>(payload: T): CallHandler {
  return {
    handle: () => of(payload),
  };
}

describe('PaginationInterceptor (flat-shape contract)', () => {
  const interceptor = new PaginationInterceptor<unknown>();

  it('returns a flat object with data, total, page, limit, totalPages for a paginated result', async () => {
    const paginated: PaginatedPayload<{ id: string }> = {
      data: [{ id: 'a' }, { id: 'b' }],
      total: 47,
      page: 1,
      limit: 10,
    };

    const result = (await firstValueFrom(
      interceptor.intercept(makeContext(), makeCallHandler(paginated)),
    )) as Record<string, unknown>;

    expect(result.data).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.total).toBe(47);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(Math.ceil(47 / 10));
  });

  it('does NOT include a nested `pagination` envelope', async () => {
    const paginated: PaginatedPayload<{ id: string }> = {
      data: [],
      total: 0,
      page: 1,
      limit: 25,
    };

    const result = (await firstValueFrom(
      interceptor.intercept(makeContext(), makeCallHandler(paginated)),
    )) as Record<string, unknown>;

    expect(result).not.toHaveProperty('pagination');
  });

  it('derives totalPages as Math.ceil(total / limit)', async () => {
    const cases: Array<{ total: number; limit: number; expected: number }> = [
      { total: 30, limit: 10, expected: 3 },
      { total: 47, limit: 10, expected: 5 },
      { total: 1, limit: 25, expected: 1 },
      { total: 0, limit: 25, expected: 0 },
    ];

    for (const c of cases) {
      const paginated: PaginatedPayload<unknown> = {
        data: [],
        total: c.total,
        page: 1,
        limit: c.limit,
      };
      const result = (await firstValueFrom(
        interceptor.intercept(makeContext(), makeCallHandler(paginated)),
      )) as { totalPages: number };
      expect(result.totalPages).toBe(c.expected);
    }
  });

  it('passes non-paginated values through unchanged', async () => {
    const kpis = { totalProducts: 10, activeCount: 7, lowStockCount: 2 };

    const result = await firstValueFrom(
      interceptor.intercept(makeContext(), makeCallHandler(kpis)),
    );

    expect(result).toEqual(kpis);
    expect(result).not.toHaveProperty('totalPages');
  });
});
