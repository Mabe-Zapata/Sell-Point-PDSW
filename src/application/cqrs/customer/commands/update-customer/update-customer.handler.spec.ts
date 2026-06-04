import { UpdateCustomerHandler } from './update-customer.handler';
import { Customer } from '../../../../../domain/entities/customer.entity';
import { EntityNotFoundException } from '../../../../../domain/exceptions/entity-not-found.exception';

describe('UpdateCustomerHandler (application layer)', () => {
  let mockRepository: any;
  let handler: UpdateCustomerHandler;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByIdentificationNumber: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    handler = new UpdateCustomerHandler(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when updating a customer to another customer email', async () => {
    const existingCustomer = {
      id: 'cust-a',
      cedula: '0901234567',
      firstName: 'Alice',
      lastName: 'One',
      email: 'alice@test.com',
      phone: '0991111111',
      address: 'Street 1',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    } as Customer;

    const collidingCustomer = {
      id: 'cust-b',
      email: 'bob@test.com',
    } as Customer;

    mockRepository.findById.mockResolvedValue(existingCustomer);
    mockRepository.findByEmail.mockResolvedValue(collidingCustomer);

    await expect(
      handler.execute({
        id: 'cust-a',
        payload: {
          email: 'bob@test.com',
        },
      } as any),
    ).rejects.toMatchObject({
      name: 'DuplicateCustomerFieldsException',
      errors: { email: expect.any(String) },
    });

    expect(mockRepository.findByEmail).toHaveBeenCalledWith('bob@test.com');
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('allows updating a customer without changing the email', async () => {
    const existingCustomer = {
      id: 'cust-a',
      cedula: '0901234567',
      firstName: 'Alice',
      lastName: 'One',
      email: 'alice@test.com',
      phone: '0991111111',
      address: 'Street 1',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    } as Customer;

    mockRepository.findById.mockResolvedValue(existingCustomer);
    mockRepository.update.mockImplementation(async (customer: Customer) => customer);

    const result = await handler.execute({
      id: 'cust-a',
      payload: {
        email: 'alice@test.com',
        firstName: 'Alicia',
      },
    } as any);

    expect(mockRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockRepository.update).toHaveBeenCalled();
    expect(result.email).toBe('alice@test.com');
    expect(result.firstName).toBe('Alicia');
  });

  it('throws EntityNotFoundException when customer does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute({ id: 'missing-id', payload: {} } as any),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
