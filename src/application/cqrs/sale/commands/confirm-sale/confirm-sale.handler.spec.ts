import { ConfirmSaleHandler } from './confirm-sale.handler';
import { ConfirmSaleUseCase } from '../../../../use-cases/sale/confirm-sale.use-case';
import { ConfirmSaleCommand } from './confirm-sale.command';

describe('ConfirmSaleHandler', () => {
  let handler: ConfirmSaleHandler;
  let mockUseCase: jest.Mocked<ConfirmSaleUseCase>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    handler = new ConfirmSaleHandler(mockUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
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
  });
});
