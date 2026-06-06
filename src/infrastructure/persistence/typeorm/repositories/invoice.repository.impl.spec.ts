import { QueryRunner } from 'typeorm';
import { InvoiceRepositoryImpl } from './invoice.repository.impl';
import { Invoice, InvoiceStatus } from '../../../../domain/entities';

describe('InvoiceRepositoryImpl', () => {
  it('persists invoice audit snapshots on create', async () => {
    const create = jest.fn((_entityName: string, payload: Record<string, unknown>) => payload);
    const save = jest.fn(async (_entityName: string, payload: Record<string, unknown>) => ({
      ...payload,
      createdAt: new Date('2026-06-05T00:45:34.178Z'),
    }));

    const qr = {
      manager: {
        create,
        save,
      },
    } as unknown as QueryRunner;

    const repository = new InvoiceRepositoryImpl(qr);

    const invoice = new Invoice({
      id: 'inv-1',
      saleId: 'sale-1',
      seriesId: 'series-1',
      invoiceNumber: '001-001-000100007',
      issueDate: new Date('2026-06-04T19:45:35.757Z'),
      status: InvoiceStatus.ISSUED,
      customerNameSnapshot: 'Carlos LuisiMiercole',
      customerCedulaSnapshot: '1850585009',
      customerEmailSnapshot: 'erick_guerron@outlook.com',
      cashierNameSnapshot: 'Juan Medana',
      cashierUsernameSnapshot: 'vendedo',
      cashierEmployeeIdSnapshot: 'EMP-29AFE532E294443F',
    });

    const result = await repository.create(invoice);

    expect(create).toHaveBeenCalledWith(
      'InvoiceTypeOrmEntity',
      expect.objectContaining({
        customerNameSnapshot: 'Carlos LuisiMiercole',
        customerCedulaSnapshot: '1850585009',
        customerEmailSnapshot: 'erick_guerron@outlook.com',
        cashierNameSnapshot: 'Juan Medana',
        cashierUsernameSnapshot: 'vendedo',
        cashierEmployeeIdSnapshot: 'EMP-29AFE532E294443F',
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        customerNameSnapshot: 'Carlos LuisiMiercole',
        customerCedulaSnapshot: '1850585009',
        customerEmailSnapshot: 'erick_guerron@outlook.com',
        cashierNameSnapshot: 'Juan Medana',
        cashierUsernameSnapshot: 'vendedo',
        cashierEmployeeIdSnapshot: 'EMP-29AFE532E294443F',
      }),
    );
  });
});
