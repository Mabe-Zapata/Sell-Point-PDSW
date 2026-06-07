import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateCategoryCommand } from '../../application/cqrs/category/commands/create-category/create-category.command';
import { GetCategoryQuery } from '../../application/cqrs/category/queries/get-category/get-category.query';
import { ListCategoriesQuery } from '../../application/cqrs/category/queries/list-categories/list-categories.query';
import { UpdateCategoryCommand } from '../../application/cqrs/category/commands/update-category/update-category.command';
import { ActivateCategoryCommand } from '../../application/cqrs/category/commands/activate-category/activate-category.command';
import { DeactivateCategoryCommand } from '../../application/cqrs/category/commands/deactivate-category/deactivate-category.command';
import { CATEGORY_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { ICategoryRepository } from '../../domain/repositories';

import { CreateCategoryDto } from '../../application/dto/category/create-category.dto';
import { UpdateCategoryDto } from '../../application/dto/category/update-category.dto';
import { CategoryResponseDto } from '../../application/dto/category/category-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { PaginationQueryDto } from '../dto/pagination/pagination-query.dto';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create a new category (ADMIN only)',
    description: 'Registers a new category in the system. Ensures category name uniqueness.',
  })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.commandBus.execute(
      new CreateCategoryCommand(createCategoryDto),
    );
    return CategoryResponseDto.fromEntity(category);
  }

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description: 'Retrieves a paginated list of categories with optional filters.',
  })
  @ApiQuery({ name: 'page', description: 'Page number (default: 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of items per page (default: 20)', required: false, type: Number })
  @ApiQuery({ name: 'q', description: 'Search query (searches in name)', required: false, type: String })
  @ApiQuery({ name: 'isActive', description: 'Filter by active status', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of categories retrieved successfully',
  })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('q') searchQuery?: string,
    @Query('isActive') isActive?: string,
  ): Promise<{
    data: CategoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
    };

    const isAct = isActive === undefined ? undefined : isActive === 'true';

    const result = await this.queryBus.execute(
      new ListCategoriesQuery(pagination, searchQuery, isAct),
    );

    return {
      data: CategoryResponseDto.fromEntities(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('kpis')
  @ApiOperation({
    summary: 'Get category KPI counts',
    description: 'Returns dashboard-friendly category counts: total and active.',
  })
  @ApiResponse({ status: 200, description: 'Category KPI counts retrieved successfully' })
  async getKpis(): Promise<{ totalCategories: number; activeCount: number }> {
    const [total, active] = await Promise.all([
      this.categoryRepository.findAll({ page: 1, limit: 1 }),
      this.categoryRepository.findAll({ page: 1, limit: 1 }, { isActive: true }),
    ]);

    return {
      totalCategories: total.total,
      activeCount: active.total,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a category by ID',
    description: 'Retrieves a category by their unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Category UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    const category = await this.queryBus.execute(new GetCategoryQuery(id));
    return CategoryResponseDto.fromEntity(category);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update a category (ADMIN only)',
    description: 'Updates an existing category. Throws 404 if the category is not found.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID', type: String })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.commandBus.execute(
      new UpdateCategoryCommand(id, updateCategoryDto),
    );
    return CategoryResponseDto.fromEntity(category);
  }

  @Patch(':id/activate')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Activate a category (ADMIN only)',
    description: 'Sets a category as active.',
  })
  @ApiParam({ name: 'id', description: 'Category UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Category activated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    const category = await this.commandBus.execute(
      new ActivateCategoryCommand(id),
    );
    return CategoryResponseDto.fromEntity(category);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Deactivate a category (ADMIN only)',
    description: 'Sets a category as inactive (logical soft delete).',
  })
  @ApiParam({ name: 'id', description: 'Category UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Category deactivated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    const category = await this.commandBus.execute(
      new DeactivateCategoryCommand(id),
    );
    return CategoryResponseDto.fromEntity(category);
  }
}
