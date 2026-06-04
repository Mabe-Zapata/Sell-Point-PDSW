import { LOW_STOCK_THRESHOLD } from '../../../domain/constants/inventory.constants';
import { DashboardQueryService } from './dashboard.query.service';

describe('DashboardQueryService', () => {
  let service: DashboardQueryService;
  let saleRepository: any;
  let invoiceRepository: any;
  let productRepository: any;

  const createBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  });

  beforeEach(() => {
    saleRepository = { createQueryBuilder: jest.fn() };
    invoiceRepository = { createQueryBuilder: jest.fn() };
    productRepository = { createQueryBuilder: jest.fn() };
    service = new DashboardQueryService(saleRepository, invoiceRepository, productRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('maps aggregate results into the canonical KPI payload', async () => {
    const salesTodayBuilder = createBuilder();
    salesTodayBuilder.getRawOne.mockResolvedValue({ total: '125.5' });

    const salesMonthBuilder = createBuilder();
    salesMonthBuilder.getRawOne.mockResolvedValue({ total: '300.25' });

    const invoiceBuilder = createBuilder();
    invoiceBuilder.getRawOne.mockResolvedValue({ total: '8' });

    const productBuilder = createBuilder();
    productBuilder.getRawOne.mockResolvedValue({ total: '2' });

    saleRepository.createQueryBuilder
      .mockImplementationOnce(() => salesTodayBuilder)
      .mockImplementationOnce(() => salesMonthBuilder);
    invoiceRepository.createQueryBuilder.mockImplementation(() => invoiceBuilder);
    productRepository.createQueryBuilder.mockReturnValue(productBuilder);

    const stats = await service.getStats('branch-123');

    expect(stats).toEqual({
      ventasDelDia: 125.5,
      ventasDelMes: 300.25,
      totalFacturas: 8,
      productosConStockBajo: 2,
    });
    expect(salesTodayBuilder.andWhere).toHaveBeenCalledWith('sale.branchId = :branchId', {
      branchId: 'branch-123',
    });
    expect(invoiceBuilder.where).toHaveBeenCalledWith('sale.branchId = :branchId', {
      branchId: 'branch-123',
    });
  });

  it('returns zeros when aggregates are empty', async () => {
    const salesTodayBuilder = createBuilder();
    salesTodayBuilder.getRawOne.mockResolvedValue({ total: null });

    const salesMonthBuilder = createBuilder();
    salesMonthBuilder.getRawOne.mockResolvedValue({ total: undefined });

    const invoiceBuilder = createBuilder();
    invoiceBuilder.getRawOne.mockResolvedValue({ total: null });

    const productBuilder = createBuilder();
    productBuilder.getRawOne.mockResolvedValue({ total: undefined });

    saleRepository.createQueryBuilder
      .mockImplementationOnce(() => salesTodayBuilder)
      .mockImplementationOnce(() => salesMonthBuilder);
    invoiceRepository.createQueryBuilder.mockImplementation(() => invoiceBuilder);
    productRepository.createQueryBuilder.mockReturnValue(productBuilder);

    await expect(service.getStats()).resolves.toEqual({
      ventasDelDia: 0,
      ventasDelMes: 0,
      totalFacturas: 0,
      productosConStockBajo: 0,
    });
  });

  it('uses local day boundaries for the daily sales query', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-04T00:30:00'));

    const salesTodayBuilder = createBuilder();
    salesTodayBuilder.getRawOne.mockResolvedValue({ total: '0' });

    const salesMonthBuilder = createBuilder();
    salesMonthBuilder.getRawOne.mockResolvedValue({ total: '0' });

    const invoiceBuilder = createBuilder();
    invoiceBuilder.getRawOne.mockResolvedValue({ total: '0' });

    const productBuilder = createBuilder();
    productBuilder.getRawOne.mockResolvedValue({ total: '0' });

    saleRepository.createQueryBuilder
      .mockImplementationOnce(() => salesTodayBuilder)
      .mockImplementationOnce(() => salesMonthBuilder);
    invoiceRepository.createQueryBuilder.mockImplementation(() => invoiceBuilder);
    productRepository.createQueryBuilder.mockReturnValue(productBuilder);

    await service.getStats();

    const startCall = salesTodayBuilder.andWhere.mock.calls.find(([sql]: [string]) =>
      sql.includes('sale.createdAt >= :start'),
    );
    const endCall = salesTodayBuilder.andWhere.mock.calls.find(([sql]: [string]) =>
      sql.includes('sale.createdAt < :end'),
    );

    expect(startCall).toBeDefined();
    expect(endCall).toBeDefined();

    const startDate = startCall![1].start as Date;
    const endDate = endCall![1].end as Date;

    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(startDate.getMilliseconds()).toBe(0);
    expect(endDate.getDate()).toBe(startDate.getDate() + 1);
  });

  it('applies the shared low-stock threshold', async () => {
    const salesTodayBuilder = createBuilder();
    salesTodayBuilder.getRawOne.mockResolvedValue({ total: '0' });

    const salesMonthBuilder = createBuilder();
    salesMonthBuilder.getRawOne.mockResolvedValue({ total: '0' });

    const invoiceBuilder = createBuilder();
    invoiceBuilder.getRawOne.mockResolvedValue({ total: '0' });

    const productBuilder = createBuilder();
    productBuilder.getRawOne.mockResolvedValue({ total: '1' });

    saleRepository.createQueryBuilder
      .mockImplementationOnce(() => salesTodayBuilder)
      .mockImplementationOnce(() => salesMonthBuilder);
    invoiceRepository.createQueryBuilder.mockImplementation(() => invoiceBuilder);
    productRepository.createQueryBuilder.mockReturnValue(productBuilder);

    await service.getStats();

    expect(productBuilder.andWhere).toHaveBeenCalledWith('product.currentStock < :threshold', {
      threshold: LOW_STOCK_THRESHOLD,
    });
  });
});
