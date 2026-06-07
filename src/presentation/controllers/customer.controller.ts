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
  Inject,
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

import { CreateCustomerCommand } from '../../application/cqrs/customer/commands/create-customer/create-customer.command';
import { GetCustomerQuery } from '../../application/cqrs/customer/queries/get-customer/get-customer.query';
import { ListCustomersWithStockQuery } from '../../application/cqrs/customer/queries/list-customers-with-stock/list-customers-with-stock.query';
import { UpdateCustomerCommand } from '../../application/cqrs/customer/commands/update-customer/update-customer.command';
import { ActivateCustomerCommand } from '../../application/cqrs/customer/commands/activate-customer/activate-customer.command';
import { DeactivateCustomerCommand } from '../../application/cqrs/customer/commands/deactivate-customer/deactivate-customer.command';
import { CUSTOMER_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { ICustomerRepository } from '../../domain/repositories';

import { CreateCustomerDto } from '../../application/dto/customer/create-customer.dto';
import { UpdateCustomerDto } from '../../application/dto/customer/update-customer.dto';
import { CustomerResponseDto } from '../../application/dto/customer/customer-response.dto';
import { CustomerListResponseDto } from '../../application/dto/customer/customer-list-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';
import { PaginationQueryDto } from '../dto/pagination/pagination-query.dto';

@ApiTags('customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: ICustomerRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new customer',
    description: 'Registers a new customer in the system. The identification number (cedula) must be unique across all active customers.',
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 409,
    description: 'Customer with this cedula already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.commandBus.execute(
      new CreateCustomerCommand(createCustomerDto),
    );
    return CustomerResponseDto.fromEntity(customer);
  }

  @Get()
  @ApiOperation({
    summary: 'List customers (pg query service)',
    description: 'Retrieves a paginated list of customers using pg raw SQL for optimal read performance.',
  })
  @ApiQuery({ name: 'page', description: 'Page number (default: 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of items per page (default: 20)', required: false, type: Number })
  @ApiQuery({ name: 'q', description: 'Search query (searches in names, cedula)', required: false, type: String })
  @ApiQuery({ name: 'cedula', description: 'Filter by cedula', required: false, type: String })
  @ApiQuery({ name: 'isActive', description: 'Filter by active status', required: false, type: Boolean })
  @ApiQuery({ name: 'createdFrom', description: 'Filter by creation date from (ISO 8601)', required: false, type: String })
  @ApiQuery({ name: 'createdTo', description: 'Filter by creation date to (ISO 8601)', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of customers retrieved successfully',
  })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('q') searchQuery?: string,
    @Query('cedula') cedula?: string,
    @Query('isActive') isActive?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
  ): Promise<{
    data: CustomerListResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 20,
    };

    const result = await this.queryBus.execute(
      new ListCustomersWithStockQuery(
        pagination,
        searchQuery,
        cedula,
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        createdFrom ? new Date(createdFrom) : undefined,
        createdTo ? new Date(createdTo) : undefined,
      ),
    );

    return {
      data: CustomerListResponseDto.fromQueryResults(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('kpis')
  @ApiOperation({
    summary: 'Get customer KPI counts',
    description: 'Returns dashboard-friendly customer counts: total, active, and inactive.',
  })
  @ApiResponse({ status: 200, description: 'Customer KPI counts retrieved successfully' })
  async getKpis(): Promise<{ totalCustomers: number; activeCustomers: number; inactiveCustomers: number }> {
    const [total, active, inactive] = await Promise.all([
      this.customerRepository.findAll({ page: 1, limit: 1 }),
      this.customerRepository.findAll({ page: 1, limit: 1 }, { isActive: true }),
      this.customerRepository.findAll({ page: 1, limit: 1 }, { isActive: false }),
    ]);

    return {
      totalCustomers: total.total,
      activeCustomers: active.total,
      inactiveCustomers: inactive.total,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a customer by ID',
    description: 'Retrieves a customer by their unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.queryBus.execute(new GetCustomerQuery(id));
    return CustomerResponseDto.fromEntity(customer);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a customer',
    description: 'Updates an existing customer profile. Throws 404 if the customer is not found or 409 if the new cedula is already taken.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID', type: String })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({
    status: 409,
    description: 'Customer with this cedula already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.commandBus.execute(
      new UpdateCustomerCommand(id, updateCustomerDto),
    );
    return CustomerResponseDto.fromEntity(customer);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate a customer',
    description: 'Sets a customer as active. Only ADMIN role can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer activated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async activate(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.commandBus.execute(
      new ActivateCustomerCommand(id),
    );
    return CustomerResponseDto.fromEntity(customer);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a customer',
    description: 'Sets a customer as inactive. Only ADMIN role can perform this action.',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer deactivated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async deactivate(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.commandBus.execute(
      new DeactivateCustomerCommand(id),
    );
    return CustomerResponseDto.fromEntity(customer);
  }

}
