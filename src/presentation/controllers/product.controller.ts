import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateProductCommand } from '../../application/cqrs/product/commands/create-product/create-product.command';
import { GetProductQuery } from '../../application/cqrs/product/queries/get-product/get-product.query';
import { ListProductsWithStockQuery } from '../../application/cqrs/product/queries/list-products-with-stock/list-products-with-stock.query';
import { UpdateProductCommand } from '../../application/cqrs/product/commands/update-product/update-product.command';
import { DeleteProductCommand } from '../../application/cqrs/product/commands/delete-product/delete-product.command';
import { ActivateProductCommand } from '../../application/cqrs/product/commands/activate-product/activate-product.command';
import { DeactivateProductCommand } from '../../application/cqrs/product/commands/deactivate-product/deactivate-product.command';
import { AdjustStockCommand } from '../../application/cqrs/inventory/commands/adjust-stock/adjust-stock.command';
import { GetMovementsHistoryQuery } from '../../application/cqrs/inventory/queries/get-movements-history/get-movements-history.query';

import { CreateProductDto } from '../../application/dto/product/create-product.dto';
import { UpdateProductDto } from '../../application/dto/product/update-product.dto';
import { ProductResponseDto } from '../../application/dto/product/product-response.dto';
import { ProductWithStockResponseDto } from '../../application/dto/product/product-with-stock-response.dto';
import { AdjustStockDto } from '../../application/dto/stock/adjust-stock.dto';
import { StockMovementResponseDto } from '../../application/dto/stock/stock-movement-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';

@ApiTags('products')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Registers a new product in the inventory. Ensures product code uniqueness and validates pricing constraints.',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.commandBus.execute(
      new CreateProductCommand(createProductDto),
    );
    return ProductResponseDto.fromEntity(product);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'Retrieves a product by their unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.queryBus.execute(new GetProductQuery(id));
    return ProductResponseDto.fromEntity(product);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with stock (pg query service)',
    description: 'Retrieves a paginated list of products using pg raw SQL for optimal read performance.',
  })
  @ApiQuery({ name: 'page', description: 'Page number (default: 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of items per page (default: 20)', required: false, type: Number })
  @ApiQuery({ name: 'q', description: 'Search query (searches in code, name)', required: false, type: String })
  @ApiQuery({ name: 'categoryId', description: 'Filter by category UUID', required: false, type: String })
  @ApiQuery({ name: 'isActive', description: 'Filter by active status', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of products retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') searchQuery?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{
    data: ProductWithStockResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const isAct = isActive === undefined ? undefined : isActive === 'true';
    const result = await this.queryBus.execute(
      new ListProductsWithStockQuery(pagination, searchQuery, categoryId, isAct),
    );

    return {
      data: ProductWithStockResponseDto.fromQueryResults(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates an existing product in the inventory. Throws 404 if the product is not found.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: String })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.commandBus.execute(
      new UpdateProductCommand(id, updateProductDto),
    );
    return ProductResponseDto.fromEntity(product);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate a product',
    description: 'Sets a product as active. Only ADMIN role can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Product activated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async activate(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.commandBus.execute(
      new ActivateProductCommand(id),
    );
    return ProductResponseDto.fromEntity(product);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a product',
    description: 'Sets a product as inactive. Only ADMIN role can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Product deactivated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deactivate(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.commandBus.execute(
      new DeactivateProductCommand(id),
    );
    return ProductResponseDto.fromEntity(product);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product (soft delete)',
    description: 'Marks a product as deleted (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Product UUID', type: String })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteProductCommand(id));
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Adjust product stock', description: 'Adjusts stock levels for a product. Creates a stock movement record.' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiBody({ type: AdjustStockDto })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 422, description: 'Insufficient stock' })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ): Promise<StockMovementResponseDto> {
    const movement = await this.commandBus.execute(
      new AdjustStockCommand(id, dto),
    );
    return StockMovementResponseDto.fromEntity(movement);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Get product stock movement history' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by movement type' })
  async findMovements(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ): Promise<{ data: StockMovementResponseDto[]; total: number; page: number; limit: number }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await this.queryBus.execute(
      new GetMovementsHistoryQuery(pagination, undefined, id, type),
    );

    return {
      data: result.data.map(m => StockMovementResponseDto.fromEntity(m)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
