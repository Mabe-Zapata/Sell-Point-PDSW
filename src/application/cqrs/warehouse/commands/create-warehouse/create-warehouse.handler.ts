import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateWarehouseCommand } from './create-warehouse.command';
import { CreateWarehouseValidator } from './create-warehouse.validator';
import { WAREHOUSE_REPOSITORY } from '../../../../tokens';
import type { IWarehouseRepository } from '../../../../../domain/repositories';
import { Warehouse } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(CreateWarehouseCommand)
export class CreateWarehouseHandler implements ICommandHandler<CreateWarehouseCommand> {
  constructor(
    private readonly validator: CreateWarehouseValidator,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(command: CreateWarehouseCommand): Promise<Warehouse> {
    this.validator.validate(command.payload);

    // R7: Only ONE main warehouse per branch
    if (command.payload.isMain === true) {
      const existingMainWarehouse = await this.warehouseRepository.findMainByBranchId(command.payload.branchId);
      if (existingMainWarehouse) {
        throw new BusinessRuleException('Branch already has a main warehouse');
      }
    }

    const warehouse = new Warehouse({
      branchId: command.payload.branchId,
      name: command.payload.name,
      isMain: command.payload.isMain ?? false,
      isActive: true,
    });

    return this.warehouseRepository.create(warehouse);
  }
}