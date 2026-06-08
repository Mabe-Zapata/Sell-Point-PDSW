 
 
 
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IProductQueryService,
  ProductListItem,
} from '../../../domain/query-services/product.query-service.interface';
import { ProductTypeOrmEntity } from '../../database/entities/product.typeorm.entity';
import { CategoryTypeOrmEntity } from '../../database/entities/category.typeorm.entity';

const MAX_LIMIT = 200;

@Injectable()
export class ProductQueryService implements IProductQueryService {
  constructor(
    @InjectRepository(ProductTypeOrmEntity)
    private readonly productRepository: Repository<ProductTypeOrmEntity>,
  ) {}

  private buildProductQuery() {
    return this.productRepository
      .createQueryBuilder('p')
      .leftJoin(CategoryTypeOrmEntity, 'c', 'c.id = p.categoryId');
  }

  // Uses covering index: idx_products_perf ON products (created_at DESC, category_id, is_active)
  async listProducts(params: {
    page: number;
    limit: number;
    q?: string;
    categoryId?: string;
    isActive?: boolean;
    createdFrom?: Date;
    createdTo?: Date;
  }): Promise<{ data: ProductListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, q, categoryId, isActive, createdFrom, createdTo } = params;
    const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const offset = (page - 1) * safeLimit;

    const searchPattern = q ? `${q}%` : null;

    const baseFilterQuery = this.productRepository
      .createQueryBuilder('p')
      .where(
        searchPattern
          ? '(UPPER(p.name) LIKE UPPER(:searchPattern) OR UPPER(p.code) LIKE UPPER(:searchPattern))'
          : '1=1',
        { searchPattern },
      )
      .andWhere(categoryId ? 'p.categoryId = :categoryId' : '1=1', { categoryId })
      .andWhere(isActive !== undefined ? 'p.isActive = :isActive' : '1=1', { isActive })
      .andWhere(createdFrom ? 'p.createdAt >= :createdFrom' : '1=1', { createdFrom })
      .andWhere(createdTo ? 'p.createdAt <= :createdTo' : '1=1', { createdTo });

    const [total, pagedIds] = await Promise.all([
      baseFilterQuery.clone().getCount(),
      baseFilterQuery
        .clone()
        .select('p.id', 'id')
        .orderBy('p.createdAt', 'DESC')
        .offset(offset)
        .limit(safeLimit)
        .getRawMany<{ id: string }>(),
    ]);

    const ids = pagedIds.map((row) => String(row.id));

    if (!ids.length) {
      return {
        data: [],
        total,
        page,
        limit: safeLimit,
      };
    }

    const rows = await this.buildProductQuery()
      .select([
        'p.id AS "id"',
        'p.code AS "code"',
        'p.name AS "name"',
        'p.salePrice AS "salePrice"',
        'p.costPrice AS "costPrice"',
        'p.currentStock AS "currentStock"',
        'p.categoryId AS "categoryId"',
        'c.name AS "categoryName"',
        'p.isActive AS "isActive"',
      ])
      .where('p.id IN (:...ids)', { ids })
      .orderBy('p.createdAt', 'DESC')
      .getRawMany<ProductListItem>();

    const rowsById = new Map(rows.map((row) => [String(row.id), row]));
    const orderedRows = ids.map((id) => rowsById.get(id)).filter((row): row is ProductListItem => Boolean(row));

    return {
      data: orderedRows.map((row) => ({
        ...row,
        salePrice: Number(row.salePrice),
        costPrice: Number(row.costPrice),
        currentStock: Number(row.currentStock),
      })),
      total,
      page,
      limit: safeLimit,
    };
  }

  async getProductWithStock(
    id: string,
  ): Promise<(ProductListItem & { warehouseStock: { warehouseId: string; warehouseName: string; currentStock: number }[] }) | null> {
    const row = await this.buildProductQuery()
      .where('p.id = :id', { id })
      .select([
        'p.id AS "id"',
        'p.code AS "code"',
        'p.name AS "name"',
        'p.salePrice AS "salePrice"',
        'p.costPrice AS "costPrice"',
        'p.currentStock AS "currentStock"',
        'p.categoryId AS "categoryId"',
        'c.name AS "categoryName"',
        'p.isActive AS "isActive"',
      ])
      .getRawOne<ProductListItem>();

    if (!row) {
      return null;
    }

    return {
      ...row,
      salePrice: Number(row.salePrice),
      costPrice: Number(row.costPrice),
      currentStock: Number(row.currentStock),
      warehouseStock: [],
    };
  }
}
