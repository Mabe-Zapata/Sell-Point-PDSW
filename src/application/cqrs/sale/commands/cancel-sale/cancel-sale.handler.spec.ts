/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { CancelSaleHandler } from './cancel-sale.handler';
import { CancelSaleValidator } from './cancel-sale.validator';
import { CancelSaleUseCase } from '../../../../use-cases/sale/cancel-sale.use-case';
import { UNIT_OF_WORK } from '../../../../tokens';
import type { IUnitOfWork } from '../../../../../application/unit-of-work/unit-of-work.interface';
import { CancelSaleCommand } from './cancel-sale.command';

describe('CancelSaleHandler', () => {
  let handler: CancelSaleHandler;
  let mockUseCase: jest.Mocked<CancelSaleUseCase>;
  let mockUow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    mockUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockUow = {
      start: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      dispatchEvent: jest.fn(),
      sales: {} as any,
      saleDetails: {} as any,
      products: {} as any,
      stockMovements: {} as any,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSaleHandler,
        CancelSaleValidator,
        { provide: UNIT_OF_WORK, useValue: mockUow },
        { provide: CancelSaleUseCase, useValue: mockUseCase },
      ],
    }).compile();

    handler = module.get<CancelSaleHandler>(CancelSaleHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should call validator with saleId', async () => {
      const command = new CancelSaleCommand('sale-123');
      const validatorSpy = jest.spyOn(handler['validator'], 'validate');
      await handler.execute(command);
      expect(validatorSpy).toHaveBeenCalledWith('sale-123');
    });

    it('should delegate to CancelSaleUseCase', async () => {
      const command = new CancelSaleCommand('sale-123');
      await handler.execute(command);
      expect(mockUseCase.execute).toHaveBeenCalledWith('sale-123');
    });

    it('should throw if use case throws', async () => {
      mockUseCase.execute.mockRejectedValueOnce(new Error('Sale not found'));
      const command = new CancelSaleCommand('sale-123');
      await expect(handler.execute(command)).rejects.toThrow('Sale not found');
    });

    it('should not interact with uow directly (thin delegate)', async () => {
      const command = new CancelSaleCommand('sale-123');
      await handler.execute(command);
      expect(mockUow.start).not.toHaveBeenCalled();
      expect(mockUow.commit).not.toHaveBeenCalled();
    });
  });
});