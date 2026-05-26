import { CancelSaleHandler } from './cancel-sale.handler';
import { CancelSaleUseCase } from '../../../../use-cases/sale/cancel-sale.use-case';
import { CancelSaleCommand } from './cancel-sale.command';

describe('CancelSaleHandler', () => {
  let handler: CancelSaleHandler;
  let mockUseCase: jest.Mocked<CancelSaleUseCase>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    handler = new CancelSaleHandler(mockUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
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
  });
});
