import { QuickConfirmSaleCommand } from './quick-confirm-sale.command';
import type { QuickConfirmSaleResult } from '../../../../use-cases/sale/quick-confirm-sale.use-case';
import { QuickConfirmSaleUseCase } from '../../../../use-cases/sale/quick-confirm-sale.use-case';
import type { ICategoryRepository } from '../../../../../domain/repositories/category.repository.interface';
import type { ITaxRateRepository } from '../../../../../domain/repositories/tax-rate.repository.interface';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { ICustomerRepository } from '../../../../../domain/repositories/customer.repository.interface';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';

// Thin pure wrapper - actual logic in QuickConfirmSaleUseCase
export class QuickConfirmSaleHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly categoryRepository: ICategoryRepository,
    private readonly taxRateRepository: ITaxRateRepository,
    private readonly userRepository: IUserRepository,
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(command: QuickConfirmSaleCommand): Promise<QuickConfirmSaleResult> {
    const useCase = new QuickConfirmSaleUseCase(
      this.uow,
      this.categoryRepository,
      this.taxRateRepository,
      this.userRepository,
      this.customerRepository,
    );
    return useCase.execute(command.payload);
  }
}
