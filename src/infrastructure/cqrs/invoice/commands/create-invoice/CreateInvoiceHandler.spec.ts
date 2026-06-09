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
      update: jest.fn(),
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
      if (target === 'InvoiceTypeOrmEntity' && options.where?.id) {
        return {
          id: options.where.id,
          saleId: 'sale-1',
          seriesId: 'series-1',
          invoiceNumber: '001-001-000000001',
          issueDate: new Date('2026-05-28T00:00:00.000Z'),
          status: 'ISSUED',
          createdAt: new Date('2026-05-28T00:00:00.000Z'),
        };
      }
      if (target === 'InvoiceSeriesTypeOrmEntity' && options.where?.branchId) {
        return invoiceSeries;
      }
      if (target === InvoiceSeriesTypeOrmEntity && options.where?.id) {
        return invoiceSeries;
      }
      if (target === 'ProductTypeOrmEntity' && options.where?.id) {
        return {
          id: options.where.id,
          code: 'P001',
          name: 'Prod 1',
          currentStock: 100,
          salePrice: 10,
          costPrice: 5,
          isActive: true,
        };
      }
      return null;
    });

    queryRunner.manager.update.mockResolvedValue({ affected: 1 });

    queryRunner.manager.createQueryBuilder.mockImplementation((target?: unknown) => {
      const builder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      if (target === 'ProductTypeOrmEntity') {
        builder.getOne = jest.fn().mockResolvedValue({
          id: 'prod-1',
          categoryId: 'cat-1',
          code: 'P001',
          name: 'Prod 1',
          salePrice: 10,
          costPrice: 5,
          isActive: true,
          currentStock: 10,
          createdAt: new Date('2026-05-28T00:00:00.000Z'),
          updatedAt: new Date('2026-05-28T00:00:00.000Z'),
        });
        return builder;
      }

      builder.getMany = jest.fn().mockResolvedValue([
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
      ]);
      return builder;
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
      if (targetOrEntity === 'StockMovementTypeOrmEntity') {
        return {
          id: 1,
          ...(entity as Record<string, unknown>),
        };
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
