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

import { CreateCustomerCommand } from '../../application/cqrs/customer/commands/create-customer/create-customer.command';
import { GetCustomerQuery } from '../../application/cqrs/customer/queries/get-customer/get-customer.query';
import { ListCustomersWithStockQuery } from '../../application/cqrs/customer/queries/list-customers-with-stock/list-customers-with-stock.query';
import { UpdateCustomerCommand } from '../../application/cqrs/customer/commands/update-customer/update-customer.command';
import { DeleteCustomerCommand } from '../../application/cqrs/customer/commands/delete-customer/delete-customer.command';

import { CreateCustomerDto } from '../../application/dto/customer/create-customer.dto';
import { UpdateCustomerDto } from '../../application/dto/customer/update-customer.dto';
import { CustomerResponseDto } from '../../application/dto/customer/customer-response.dto';
import { CustomerListResponseDto } from '../../application/dto/customer/customer-list-response.dto';
import { PaginationParams } from '../../domain/repositories/pagination.types';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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

  @Get()
  @ApiOperation({
    summary: 'List customers (pg query service)',
    description: 'Retrieves a paginated list of customers using pg raw SQL for optimal read performance.',
  })
  @ApiQuery({ name: 'page', description: 'Page number (default: 1)', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Number of items per page (default: 20)', required: false, type: Number })
  @ApiQuery({ name: 'q', description: 'Search query (searches in names, cedula)', required: false, type: String })
  @ApiQuery({ name: 'cedula', description: 'Filter by cedula', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of customers retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') searchQuery?: string,
    @Query('cedula') cedula?: string,
  ): Promise<{
    data: CustomerListResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination: PaginationParams = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const result = await this.queryBus.execute(
      // identificationType replaced by cedula (simplify-schema-uta SDD)
      new ListCustomersWithStockQuery(pagination, searchQuery, cedula),
    );

    return {
      data: CustomerListResponseDto.fromQueryResults(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
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

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a customer (soft delete)',
    description: 'Marks a customer as deleted (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Customer UUID', type: String })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteCustomerCommand(id));
  }
}