import { CreateCustomerHandler } from './create-customer.handler';
import { DuplicateCedulaException } from '../../../../../domain/exceptions/duplicate-cedula.exception';
import { Customer } from '../../../../../domain/entities/customer.entity';

describe('CreateCustomerHandler (application layer)', () => {
  // The application-layer handler takes repositories as plain constructor args.
  let mockRepository: any;
  let handler: CreateCustomerHandler;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByIdentificationNumber: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    handler = new CreateCustomerHandler(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should check for duplicate and create customer', async () => {
      const mockCustomer = {
        id: 'cust-123',
        cedula: '0901234567',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '0991234567',
        address: 'Test address',
        isActive: true,
      } as Customer;

      mockRepository.findByIdentificationNumber.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCustomer);

      const dto = {
        cedula: '0901234567',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '0991234567',
        address: 'Test address',
      };

      const result = await handler.execute({ payload: dto } as any);

      expect(mockRepository.findByIdentificationNumber).toHaveBeenCalledWith('0901234567');
      expect(mockRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });

    it('should throw DuplicateCedulaException when customer exists', async () => {
      const existingCustomer = { id: 'cust-existing', cedula: '0901234567' } as Customer;
      mockRepository.findByIdentificationNumber.mockResolvedValue(existingCustomer);

      const dto = {
        cedula: '0901234567',
        firstName: 'John',
        lastName: 'Doe',
      };

      // The handler throws before calling create
      await expect(handler.execute({ payload: dto } as any)).rejects.toThrow(DuplicateCedulaException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      mockRepository.findByIdentificationNumber.mockResolvedValue(null);
      mockRepository.findByEmail.mockResolvedValue({ id: 'cust-existing', email: 'foo@bar.com' } as Customer);

      const dto = {
        cedula: '0901234567',
        firstName: 'John',
        lastName: 'Doe',
        email: 'foo@bar.com',
      };

      await expect(handler.execute({ payload: dto } as any)).rejects.toMatchObject({
        name: 'DuplicateCustomerFieldsException',
        errors: { email: expect.any(String) },
      });

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('foo@bar.com');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });
});
