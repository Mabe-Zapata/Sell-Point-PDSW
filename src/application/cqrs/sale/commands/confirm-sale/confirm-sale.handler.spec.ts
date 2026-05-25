/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmSaleHandler } from './confirm-sale.handler';
import { ConfirmSaleValidator } from './confirm-sale.validator';
import { ConfirmSaleUseCase } from '../../../../use-cases/sale/confirm-sale.use-case';
import { UNIT_OF_WORK } from '../../../../tokens';
import type { IUnitOfWork } from '../../../../../application/unit-of-work/unit-of-work.interface';
import { ConfirmSaleCommand } from './confirm-sale.command';

describe('ConfirmSaleHandler', () => {
  let handler: ConfirmSaleHandler;
  let mockUseCase: jest.Mocked<ConfirmSaleUseCase>;
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
        ConfirmSaleHandler,
        ConfirmSaleValidator,
        { provide: UNIT_OF_WORK, useValue: mockUow },
        { provide: ConfirmSaleUseCase, useValue: mockUseCase },
      ],
    }).compile();

    handler = module.get<ConfirmSaleHandler>(ConfirmSaleHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should call validator with saleId', async () => {
      const command = new ConfirmSaleCommand('sale-123');
      const validatorSpy = jest.spyOn(handler['validator'], 'validate');
      await handler.execute(command);
      expect(validatorSpy).toHaveBeenCalledWith('sale-123');
    });

    it('should delegate to ConfirmSaleUseCase', async () => {
      const command = new ConfirmSaleCommand('sale-123');
      await handler.execute(command);
      expect(mockUseCase.execute).toHaveBeenCalledWith('sale-123');
    });

    it('should throw if use case throws', async () => {
      mockUseCase.execute.mockRejectedValueOnce(new Error('Stock insufficient'));
      const command = new ConfirmSaleCommand('sale-123');
      await expect(handler.execute(command)).rejects.toThrow('Stock insufficient');
    });

    it('should not interact with uow directly (thin delegate)', async () => {
      const command = new ConfirmSaleCommand('sale-123');
      await handler.execute(command);
      // Handler is a thin delegate — it should NOT call uow directly
      expect(mockUow.start).not.toHaveBeenCalled();
      expect(mockUow.commit).not.toHaveBeenCalled();
    });
  });
});