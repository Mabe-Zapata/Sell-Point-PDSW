import { EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateInvoiceCommand } from '../../../../../application/cqrs/invoice/commands/create-invoice/create-invoice.command';
import { InvoiceSeriesTypeOrmEntity } from '../../../../database/entities/invoice-series.typeorm.entity';
import { CreateInvoiceHandler } from './CreateInvoiceHandler';

describe('Infrastructure CreateInvoiceHandler', () => {
  const invoiceSeries = {
    id: 'series-1',
    branchId: 'branch-1',
    establishmentCode: '001',
    emissionPointCode: '001',
    currentSequence: 0,
    isActive: true,
    createdAt: new Date('2026-05-28T00:00:00.000Z'),
    updatedAt: new Date('2026-05-28T00:00:00.000Z'),
  };

  const queryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn((_target: unknown, entity: unknown) => entity),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => queryRunner),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  let handler: CreateInvoiceHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceSeries.currentSequence = 0;

    queryRunner.manager.findOne.mockImplementation(async (target: unknown, options: { where?: Record<string, string> }) => {
      if (target === 'InvoiceTypeOrmEntity' && options.where?.saleId) {
        return null;
      }
      if (target === 'InvoiceSeriesTypeOrmEntity' && options.where?.branchId) {
        return invoiceSeries;
      }
      if (target === InvoiceSeriesTypeOrmEntity && options.where?.id) {
        return invoiceSeries;
      }
      return null;
    });

    queryRunner.manager.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          productId: 'prod-1',
          productNameSnapshot: 'Prod 1',
          productCodeSnapshot: 'P001',
          quantity: 1,
          unitPrice: 10,
          taxRateId: 'tax-15',
          taxPercentage: 15,
          taxAmount: 1.5,
          createdAt: new Date('2026-05-28T00:00:00.000Z'),
        },
      ]),
    });

    queryRunner.manager.save.mockImplementation(async (targetOrEntity: unknown, entity?: unknown) => {
      if (targetOrEntity instanceof InvoiceSeriesTypeOrmEntity || targetOrEntity === invoiceSeries) {
        return targetOrEntity;
      }
      if (targetOrEntity === 'InvoiceTypeOrmEntity') {
        return {
          ...(entity as Record<string, unknown>),
          createdAt: new Date('2026-05-28T00:00:00.000Z'),
        };
      }
      if (targetOrEntity === 'InvoiceItemTypeOrmEntity') {
        return (entity as Record<string, unknown>[]).map((item, index) => ({
          id: `item-${index + 1}`,
          ...item,
        }));
      }
      return entity ?? targetOrEntity;
    });

    handler = new CreateInvoiceHandler(
      mockDataSource as unknown as DataSource,
      mockEventBus as unknown as EventBus,
    );
  });

  it('commits invoice creation and publishes InvoiceIssuedEvent when command has email payload', async () => {
    await handler.execute(
      new CreateInvoiceCommand(
        'sale-1',
        'branch-1',
        'customer@example.com',
        'Customer',
      ),
    );

    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('does not publish InvoiceIssuedEvent for manual requests without display data', async () => {
    await handler.execute(
      new CreateInvoiceCommand(
        'sale-1',
        'branch-1',
      ),
    );

    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('rolls back when invoice creation fails', async () => {
    queryRunner.manager.save.mockImplementationOnce(async () => {
      throw new Error('DB failed');
    });

    await expect(
      handler.execute(new CreateInvoiceCommand('sale-1', 'branch-1')),
    ).rejects.toThrow('DB failed');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
  });
});
