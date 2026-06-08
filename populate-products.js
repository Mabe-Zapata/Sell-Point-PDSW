const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'application', 'cqrs');

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content.trim());
}

// ---------------- PRODUCTS ----------------

const prodDir = path.join(baseDir, 'product');

// CreateProduct
writeFile(path.join(prodDir, 'commands', 'create-product', 'create-product.command.ts'), `
import { CreateProductDto } from '../../../../dto/product/create-product.dto';

export class CreateProductCommand {
  constructor(public readonly payload: CreateProductDto) {}
}
`);

writeFile(path.join(prodDir, 'commands', 'create-product', 'create-product.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from '../../../../dto/product/create-product.dto';

@Injectable()
export class CreateProductValidator {
  async validate(payload: CreateProductDto): Promise<void> {
    // No specific domain validation rules needed for create yet
  }
}
`);

writeFile(path.join(prodDir, 'commands', 'create-product', 'create-product.handler.ts'), `
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from './create-product.command';
import { CreateProductValidator } from './create-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    private readonly validator: CreateProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    await this.validator.validate(command.payload);
    
    const product = new Product({
      code: command.payload.code,
      name: command.payload.name,
      description: command.payload.description,
      unitPrice: command.payload.unitPrice,
      availableQuantity: command.payload.availableQuantity,
    });

    return this.productRepository.create(product);
  }
}
`);

// UpdateProduct
writeFile(path.join(prodDir, 'commands', 'update-product', 'update-product.command.ts'), `
import { UpdateProductDto } from '../../../../dto/product/update-product.dto';

export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateProductDto,
  ) {}
}
`);

writeFile(path.join(prodDir, 'commands', 'update-product', 'update-product.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@Injectable()
export class UpdateProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}

  async validate(id: string): Promise<Product> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new EntityNotFoundException('Product', id);
    }
    return existingProduct;
  }
}
`);

writeFile(path.join(prodDir, 'commands', 'update-product', 'update-product.handler.ts'), `
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateProductCommand } from './update-product.command';
import { UpdateProductValidator } from './update-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { Product } from '../../../../../domain/entities/product.entity';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    private readonly validator: UpdateProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const existingProduct = await this.validator.validate(command.id);
    const { payload } = command;

    const updatedProduct = new Product({
      id: existingProduct.id,
      code: payload.code ?? existingProduct.code,
      name: payload.name ?? existingProduct.name,
      description: payload.description !== undefined ? payload.description : existingProduct.description,
      unitPrice: payload.unitPrice ?? existingProduct.unitPrice,
      availableQuantity: payload.availableQuantity ?? existingProduct.availableQuantity,
      createdAt: existingProduct.createdAt,
      updatedAt: new Date(),
    });

    return this.productRepository.update(updatedProduct);
  }
}
`);

// DeleteProduct
writeFile(path.join(prodDir, 'commands', 'delete-product', 'delete-product.command.ts'), `
export class DeleteProductCommand {
  constructor(public readonly id: string) {}
}
`);

writeFile(path.join(prodDir, 'commands', 'delete-product', 'delete-product.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

@Injectable()
export class DeleteProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}

  async validate(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
  }
}
`);

writeFile(path.join(prodDir, 'commands', 'delete-product', 'delete-product.handler.ts'), `
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteProductCommand } from './delete-product.command';
import { DeleteProductValidator } from './delete-product.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    private readonly validator: DeleteProductValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    await this.validator.validate(command.id);
    await this.productRepository.softDelete(command.id);
  }
}
`);

// GetProduct
writeFile(path.join(prodDir, 'queries', 'get-product', 'get-product.query.ts'), `
export class GetProductQuery {
  constructor(public readonly id: string) {}
}
`);

writeFile(path.join(prodDir, 'queries', 'get-product', 'get-product.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';
import { Product } from '../../../../../domain/entities/product.entity';

@Injectable()
export class GetProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}

  async validate(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new EntityNotFoundException('Product', id);
    }
    return product;
  }
}
`);

writeFile(path.join(prodDir, 'queries', 'get-product', 'get-product.handler.ts'), `
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetProductQuery } from './get-product.query';
import { GetProductValidator } from './get-product.validator';
import { Product } from '../../../../../domain/entities/product.entity';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(private readonly validator: GetProductValidator) {}

  async execute(query: GetProductQuery): Promise<Product> {
    return this.validator.validate(query.id);
  }
}
`);

// ListProducts
writeFile(path.join(prodDir, 'queries', 'list-products', 'list-products.query.ts'), `
import { ProductFilters, PaginatedResult } from '../../../../../domain/repositories/product.repository.interface';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

export class ListProductsQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: ProductFilters = {},
  ) {}
}
`);

writeFile(path.join(prodDir, 'queries', 'list-products', 'list-products.validator.ts'), `
import { Injectable } from '@nestjs/common';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

@Injectable()
export class ListProductsValidator {
  validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit > 0 ? pagination.limit : 20;
    return { page, limit };
  }
}
`);

writeFile(path.join(prodDir, 'queries', 'list-products', 'list-products.handler.ts'), `
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ListProductsQuery } from './list-products.query';
import { ListProductsValidator } from './list-products.validator';
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
import { ProductFilters, PaginatedResult } from '../../../../../domain/repositories/product.repository.interface';
import { Product } from '../../../../../domain/entities/product.entity';

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    private readonly validator: ListProductsValidator,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(query: ListProductsQuery): Promise<PaginatedResult<Product>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.productRepository.findAll(validPagination, query.filters);
  }
}
`);

console.log('Script finish');
