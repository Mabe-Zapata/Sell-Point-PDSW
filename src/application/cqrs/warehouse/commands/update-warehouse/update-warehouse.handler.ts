import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateWarehouseCommand } from './update-warehouse.command';
import { UpdateWarehouseValidator } from './update-warehouse.validator';
import { WAREHOUSE_REPOSITORY } from '../../../../tokens';
import type { IWarehouseRepository } from '../../../../../domain/repositories';
import { Warehouse } from '../../../../../domain/entities';
import { BusinessRuleException } from '../../../../../domain/exceptions/business-rule.exception';

@CommandHandler(UpdateWarehouseCommand)
export class UpdateWarehouseHandler implements ICommandHandler<UpdateWarehouseCommand> {
  constructor(
    private readonly validator: UpdateWarehouseValidator,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(command: UpdateWarehouseCommand): Promise<Warehouse> {
    this.validator.validate(command.id, command.payload);

    const existing = await this.warehouseRepository.findById(command.id);
    if (!existing) {
      throw new Error(`Warehouse with ID '${command.id}' not found`);
    }

    // R7: Only ONE main warehouse per branch
    if (command.payload.isMain === true) {
      const existingMainWarehouse = await this.warehouseRepository.findMainByBranchId(existing.branchId);
      if (existingMainWarehouse && existingMainWarehouse.id !== command.id) {
        throw new BusinessRuleException('Branch already has a main warehouse');
      }
    }

    const updated = new Warehouse({
      ...existing,
      ...command.payload,
    });

    return this.warehouseRepository.update(updated);
  }
}