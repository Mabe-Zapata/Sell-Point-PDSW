import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { CustomerController } from './customer.controller';
import { ListCustomersWithStockQuery } from '../../application/cqrs/customer/queries/list-customers-with-stock/list-customers-with-stock.query';
import { GetCustomerQuery } from '../../application/cqrs/customer/queries/get-customer/get-customer.query';
import { CreateCustomerCommand } from '../../application/cqrs/customer/commands/create-customer/create-customer.command';

describe('CustomerController', () => {
  let controller: CustomerController;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    mockQueryBus = {
      execute: jest.fn(),
    } as any;

    mockCommandBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: CommandBus, useValue: mockCommandBus },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
  });

  describe('findAll', () => {
    it('should call queryBus.execute with ListCustomersWithStockQuery', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.findAll('1', '20', 'john', '9999999999999');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(ListCustomersWithStockQuery),
      );
      const calledQuery = mockQueryBus.execute.mock.calls[0][0] as ListCustomersWithStockQuery;
      expect(calledQuery.pagination).toEqual({ page: 1, limit: 20 });
      expect(calledQuery.q).toBe('john');
      expect(calledQuery.cedula).toBe('9999999999999');
      expect(result).toEqual(mockResult);
    });

    it('should use default pagination when params not provided', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      mockQueryBus.execute.mockResolvedValue(mockResult);

      await controller.findAll(undefined, undefined, undefined, undefined);

      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(ListCustomersWithStockQuery),
      );
    });
  });

  describe('findOne', () => {
    it('should call queryBus.execute with GetCustomerQuery', async () => {
      const mockCustomer = {
        id: 'cust-123',
        firstName: 'John',
        lastName: 'Doe',
      };
      mockQueryBus.execute.mockResolvedValue(mockCustomer);

      const result = await controller.findOne('cust-123');

      expect(mockQueryBus.execute).toHaveBeenCalledWith(new GetCustomerQuery('cust-123'));
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('create', () => {
    it('should call commandBus.execute with CreateCustomerCommand', async () => {
      const mockCustomer = {
        id: 'cust-123',
        firstName: 'John',
        lastName: 'Doe',
      };
      mockCommandBus.execute.mockResolvedValue(mockCustomer);

      const createDto = {
        cedula: '0901234567',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await controller.create(createDto);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CreateCustomerCommand(createDto),
      );
      expect(result).toEqual(mockCustomer);
    });
  });
});