import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateCustomerHandler } from './create-customer.handler';
import { CreateCustomerValidator } from './create-customer.validator';
import { CUSTOMER_REPOSITORY } from '../../../../tokens';
import type { ICustomerRepository } from '../../../../../domain/repositories';
import { Customer } from '../../../../../domain/entities/customer.entity';
import { CreateCustomerCommand } from './create-customer.command';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { CreateCustomerDto } from '../../../../dto/customer/create-customer.dto';

describe('CreateCustomerHandler', () => {
  let handler: CreateCustomerHandler;
  let mockRepository: jest.Mocked<ICustomerRepository>;
  let mockValidator: CreateCustomerValidator;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      findByIdentificationNumber: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    mockValidator = {
      validate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCustomerHandler,
        { provide: CreateCustomerValidator, useValue: mockValidator },
        { provide: CUSTOMER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreateCustomerHandler>(CreateCustomerHandler);
  });

  it('should check for duplicate and create customer', async () => {
    const mockCustomer = {
      id: 'cust-123',
      cedula: '0901234567',
      names: 'John Doe',
      email: 'john@test.com',
      phone: '0991234567',
      address: 'Test address',
      isActive: true,
    } as Customer;

    mockRepository.findByIdentificationNumber.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(mockCustomer);

    const dto: CreateCustomerDto = {
      cedula: '0901234567',
      names: 'John Doe',
      email: 'john@test.com',
      phone: '0991234567',
      address: 'Test address',
    };

    const command = new CreateCustomerCommand(dto);
    const result = await handler.execute(command);

    expect(mockRepository.findByIdentificationNumber).toHaveBeenCalledWith('0901234567');
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cedula: '0901234567',
        names: 'John Doe',
      }),
    );
    expect(result).toEqual(mockCustomer);
  });

  it('should throw DuplicateCedulaException when customer exists', async () => {
    const existingCustomer = { id: 'cust-existing', cedula: '0901234567' } as Customer;
    mockRepository.findByIdentificationNumber.mockResolvedValue(existingCustomer);

    const dto: CreateCustomerDto = {
      cedula: '0901234567',
      names: 'John Doe',
    };

    const command = new CreateCustomerCommand(dto);

    await expect(handler.execute(command)).rejects.toThrow(DuplicateCedulaException);
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
});