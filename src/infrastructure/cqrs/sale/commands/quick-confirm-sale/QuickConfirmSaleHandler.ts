import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { QuickConfirmSaleCommand } from '../../../../../application/cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import type { QuickConfirmSalePayload } from '../../../../../application/cqrs/sale/commands/quick-confirm-sale/quick-confirm-sale.command';
import { QuickConfirmSaleUseCase } from '../../../../../application/use-cases/sale/quick-confirm-sale.use-case';
import { TypeOrmUnitOfWork } from '../../../../persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { CATEGORY_REPOSITORY } from '../../../../common/injection-tokens';
import { TAX_RATE_REPOSITORY } from '../../../../common/injection-tokens';
import { USER_REPOSITORY } from '../../../../common/injection-tokens';
import { CUSTOMER_REPOSITORY } from '../../../../common/injection-tokens';
import { UNIT_OF_WORK } from '../../../../common/injection-tokens';
import { CategoryRepository } from '../../../../repositories/category.repository';
import { TaxRateRepository } from '../../../../repositories/tax-rate.repository';
import { UserRepository } from '../../../../repositories/user.repository';
import { CustomerRepository } from '../../../../repositories/customer.repository';
import { IdempotencyService } from '../../../../services/idempotency.service';

@CommandHandler(QuickConfirmSaleCommand)
export class QuickConfirmSaleHandler implements ICommandHandler<QuickConfirmSaleCommand> {
  private readonly useCase: QuickConfirmSaleUseCase;

  constructor(
    @Inject(UNIT_OF_WORK) uow: TypeOrmUnitOfWork,
    @Inject(CATEGORY_REPOSITORY) categoryRepo: CategoryRepository,
    @Inject(TAX_RATE_REPOSITORY) taxRateRepo: TaxRateRepository,
    @Inject(USER_REPOSITORY) userRepo: UserRepository,
    @Inject(CUSTOMER_REPOSITORY) customerRepo: CustomerRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {
    this.useCase = new QuickConfirmSaleUseCase(uow, categoryRepo, taxRateRepo, userRepo, customerRepo);
  }

  async execute(command: QuickConfirmSaleCommand) {
    const key = command.payload.idempotencyKey?.trim();
    if (!key) {
      throw new BadRequestException('x-idempotency-key header is required');
    }

    const requestHash = this.createRequestHash(command.payload);
    const beginResult = await this.idempotencyService.begin(key, requestHash);

    if (beginResult.status === 'COMPLETED') {
      return beginResult.response;
    }

    if (beginResult.status === 'PAYLOAD_MISMATCH') {
      throw new ConflictException('Idempotency key was already used with a different request payload');
    }

    if (beginResult.status === 'IN_PROGRESS') {
      throw new ConflictException('Request with this idempotency key is already in progress');
    }

    try {
      const response = await this.useCase.execute(command.payload);
      await this.idempotencyService.complete(key, response);
      return response;
    } catch (error) {
      await this.idempotencyService.fail(key);
      throw error;
    }
  }

  private createRequestHash(payload: QuickConfirmSalePayload): string {
    const normalized = {
      customerId: payload.customerId ?? null,
      cashierUserId: payload.cashierUserId,
      details: [...payload.details]
        .map((detail) => ({
          productId: detail.productId,
          quantity: Number(detail.quantity),
        }))
        .sort((a, b) => {
          const productCompare = a.productId.localeCompare(b.productId);
          return productCompare !== 0 ? productCompare : a.quantity - b.quantity;
        }),
    };

    return createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }
}
