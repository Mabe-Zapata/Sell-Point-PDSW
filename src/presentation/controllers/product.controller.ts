import {
  Controller,
  Get,
  Post,
  Put,
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
} from '@nestjs/swagger';

import { CreateProductCommand } from '../../application/cqrs/product/commands/create-product/create-product.command';
import { GetProductQuery } from '../../application/cqrs/product/queries/get-product/get-product.query';
import { ListProductsQuery } from '../../application/cqrs/product/queries/list-products/list-products.query';
import { UpdateProductCommand } from '../../application/cqrs/product/commands/update-product/update-product.command';
import { DeleteProductCommand } from '../../application/cqrs/product/commands/delete-product/delete-product.command';

import { CreateProductDto } from '../../application/dto/product/create-product.dto';
import { UpdateProductDto } from '../../application/dto/product/update-product.dto';
import { ProductResponseDto } from '../../application/dto/product/product-response.dto';
import {
  PaginationParams,
  ProductFilters,
} from '../../domain/repositories/product.repository.interface';

@ApiTags('products')
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
    summary: 'List products with pagination and search',
    description:
      'Retrieves a paginated list of products. Provides a generic search parameter `q` to filter by product ID or name.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (default: 1)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page (default: 20)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (searches in id, code, name)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of products retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') searchQuery?: string,
  ): Promise<{
    data: ProductResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const filters: ProductFilters = {
      q: searchQuery,
    };

    const result = await this.queryBus.execute(
      new ListProductsQuery(pagination, filters),
    );

    return {
      data: ProductResponseDto.fromEntities(result.data),
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
}
