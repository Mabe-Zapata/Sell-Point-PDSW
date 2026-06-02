import 'reflect-metadata';
import { DataSource, In, Repository } from 'typeorm';
import { fakerES } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { dataSource } from '../../config/typeorm.config';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from './entities/product.typeorm.entity';
import { CategoryTypeOrmEntity } from './entities/category.typeorm.entity';
import { SaleTypeOrmEntity } from './entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from './entities/sale-detail.typeorm.entity';
import { UserTypeOrmEntity } from './entities/user.typeorm.entity';
import { TaxRateTypeOrmEntity } from './entities/tax-rate.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from './entities/invoice-series.typeorm.entity';
import { InvoiceTypeOrmEntity } from './entities/invoice.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from './entities/invoice-item.typeorm.entity';
import { LotTypeOrmEntity } from './entities/lot.typeorm.entity';
import { InvoiceItemLotTypeOrmEntity } from './entities/invoice-item-lot.typeorm.entity';

// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────
const BATCH_SIZE = 500;
const TOTAL_CUSTOMERS = 100000;
const TOTAL_PRODUCTS = 100000;
const TOTAL_SALES = 100000;
const MASSIVE_LOT_STOCK = 1000;
const DEFAULT_ESTABLISHMENT_CODE = '001';
const DEFAULT_EMISSION_POINT_CODE = '001';
const CUSTOMER_CEDULA_BASE = 8000000000;

const CATEGORIES = [
  'Electrónica', 'Ropa', 'Alimentos', 'Hogar',
  'Deportes', 'Bebidas', 'Limpieza', 'Panadería',
  'Lácteos', 'Carnes',
];

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function makeProductCode(sequence: number): string {
  return `PROD-${String(sequence).padStart(8, '0')}`;
}

function makeCedula(sequence: number): string {
  return String(CUSTOMER_CEDULA_BASE + sequence);
}

function makeCustomerEmail(sequence: number): string {
  return `seed.customer.${sequence}@billflow.local`;
}

function makeInvoiceNumber(sequence: number): string {
  return `${DEFAULT_ESTABLISHMENT_CODE}-${DEFAULT_EMISSION_POINT_CODE}-${String(sequence).padStart(9, '0')}`;
}

// ─────────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────────
async function seedCategories(
  categoryRepo: Repository<CategoryTypeOrmEntity>,
  taxRateRepo: Repository<TaxRateTypeOrmEntity>,
): Promise<CategoryTypeOrmEntity[]> {
  const taxRate = await taxRateRepo.findOne({ where: { isActive: true } });
  if (!taxRate) {
    throw new Error('No existe ningún tax rate activo. Corre npm run db:seed primero.');
  }

  const existing = await categoryRepo.find();
  if (existing.length > 0) {
    for (const category of existing) {
      if (!category.taxRateId) {
        category.taxRateId = taxRate.id;
        await categoryRepo.update(category.id, { taxRateId: taxRate.id });
      }
    }
    process.stdout.write(`  Categorías ya existen: ${existing.length} — omitiendo.\n`);
    return existing;
  }

  const categories = CATEGORIES.map((name) =>
    categoryRepo.create({
      id: randomUUID(),
      name,
      description: `Categoría de ${name}`,
      taxRateId: taxRate.id,
      isActive: true,
    }),
  );

  await categoryRepo.save(categories);
  process.stdout.write(`  Categorías creadas: ${categories.length}\n`);
  return categories;
}

// ─────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────
async function seedCustomers(
  customerRepo: Repository<CustomerTypeOrmEntity>,
): Promise<string[]> {
  const existingCount = await customerRepo.count();
  if (existingCount >= TOTAL_CUSTOMERS) {
    process.stdout.write(`  Clientes ya existen: ${existingCount} — omitiendo.\n`);
    const all = await customerRepo.find({ select: ['id'] });
    return all.map((c) => c.id);
  }

  const existingCustomers = await customerRepo.find({ select: ['cedula', 'email'] });
  const usedCedulas = new Set(existingCustomers.map((customer) => customer.cedula).filter((value): value is string => Boolean(value)));
  const usedEmails = new Set(existingCustomers.map((customer) => customer.email).filter((value): value is string => Boolean(value)));

  process.stdout.write(`\nInsertando ${TOTAL_CUSTOMERS} clientes en lotes de ${BATCH_SIZE}...\n`);
  const allIds: string[] = [];
  let sequence = 1;

  for (let batch = 0; batch < TOTAL_CUSTOMERS / BATCH_SIZE; batch++) {
    const customers: CustomerTypeOrmEntity[] = [];

    while (customers.length < BATCH_SIZE) {
      const cedula = makeCedula(sequence);
      const email = makeCustomerEmail(sequence);
      sequence += 1;

      if (usedCedulas.has(cedula) || usedEmails.has(email)) continue;

      usedCedulas.add(cedula);
      usedEmails.add(email);

      customers.push(customerRepo.create({
        id: randomUUID(),
        cedula,
        firstName: fakerES.person.firstName(),
        lastName: fakerES.person.lastName(),
        email,
        phone: fakerES.phone.number(),
        address: fakerES.location.streetAddress(),
        isActive: true,
      }));
    }

    const saved = await customerRepo.save(customers);
    saved.forEach((c) => allIds.push(c.id));
    process.stdout.write(`  Clientes insertados: ${allIds.length}/${TOTAL_CUSTOMERS}\r`);
  }

  process.stdout.write(`\n  ✓ Clientes completados: ${allIds.length}\n`);
  return allIds;
}

// ─────────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────────
async function seedProducts(
  productRepo: Repository<ProductTypeOrmEntity>,
  categories: CategoryTypeOrmEntity[],
): Promise<string[]> {
  const existingCount = await productRepo.count();
  if (existingCount >= TOTAL_PRODUCTS) {
    process.stdout.write(`  Productos ya existen: ${existingCount} — omitiendo.\n`);
    const all = await productRepo.find({ select: ['id'] });
    return all.map((p) => p.id);
  }

  process.stdout.write(`\nInsertando ${TOTAL_PRODUCTS} productos en lotes de ${BATCH_SIZE}...\n`);
  const allIds: string[] = [];

  for (let batch = 0; batch < TOTAL_PRODUCTS / BATCH_SIZE; batch++) {
    const batchOffset = batch * BATCH_SIZE;
    const products = Array.from({ length: BATCH_SIZE }, (_, index) => {
      const sequence = batchOffset + index + 1;
      const salePrice = randomPrice(0.5, 999.99);
      return productRepo.create({
        id: randomUUID(),
        categoryId: randomItem(categories).id,
        code: makeProductCode(sequence),
        name: fakerES.commerce.productName(),
        description: fakerES.commerce.productDescription(),
        salePrice,
        costPrice: Math.round(salePrice * 0.6 * 100) / 100,
        currentStock: MASSIVE_LOT_STOCK,
        isActive: true,
      });
    });

    const saved = await productRepo.save(products);
    saved.forEach((p) => allIds.push(p.id));
    process.stdout.write(`  Productos insertados: ${allIds.length}/${TOTAL_PRODUCTS}\r`);
  }

  process.stdout.write(`\n  ✓ Productos completados: ${allIds.length}\n`);
  return allIds;
}

async function seedLotsForProducts(ds: DataSource): Promise<void> {
  const productRepo = ds.getRepository(ProductTypeOrmEntity);
  const lotRepo = ds.getRepository(LotTypeOrmEntity);

  const productCount = await productRepo.count();
  const existingLotProductIds = new Set(
    (await lotRepo.find({ select: ['productId'] })).map((lot) => lot.productId),
  );

  if (existingLotProductIds.size >= productCount) {
    process.stdout.write(`  Lotes ya existen para productos: ${existingLotProductIds.size} — omitiendo.\n`);
    return;
  }

  process.stdout.write(`\nCreando lotes FIFO para productos en lotes de ${BATCH_SIZE}...\n`);
  let processed = 0;
  let created = 0;

  while (processed < productCount) {
    const products = await productRepo.find({
      order: { code: 'ASC' },
      skip: processed,
      take: BATCH_SIZE,
    });

    if (products.length === 0) break;

    const lots: LotTypeOrmEntity[] = [];
    const productIdsToRestock: string[] = [];

    for (const product of products) {
      if (existingLotProductIds.has(product.id)) continue;

      const stock = Math.max(Number(product.currentStock ?? 0), MASSIVE_LOT_STOCK);
      if ((product.currentStock ?? 0) !== stock) {
        productIdsToRestock.push(product.id);
      }

      lots.push(lotRepo.create({
        id: randomUUID(),
        productId: product.id,
        lotCode: `LOT-${product.code}`,
        quantityReceived: stock,
        quantityAvailable: stock,
        unitCost: product.costPrice,
        estimatedUnitProfit: Number((Number(product.salePrice) - Number(product.costPrice)).toFixed(2)),
        receivedAt: new Date('2026-01-01T00:00:00.000Z'),
      }));
    }

    if (productIdsToRestock.length > 0) {
      await productRepo
        .createQueryBuilder()
        .update(ProductTypeOrmEntity)
        .set({ currentStock: MASSIVE_LOT_STOCK })
        .where({ id: In(productIdsToRestock) })
        .execute();
    }
    if (lots.length > 0) {
      await lotRepo.insert(lots);
      created += lots.length;
    }

    processed += products.length;
    process.stdout.write(`  Lotes creados: ${created} | Productos revisados: ${processed}/${productCount}\r`);
  }

  process.stdout.write(`\n  ✓ Lotes completados: ${created} nuevos\n`);
}

// ─────────────────────────────────────────────
// VENTAS + DETALLES
// ─────────────────────────────────────────────
async function seedSales(
  customerIds: string[],
  productIds: string[],
  cashierUserId: string,
  branchId: string,
  taxRate: TaxRateTypeOrmEntity,
  ds: DataSource,
): Promise<void> {
  const saleRepo = ds.getRepository(SaleTypeOrmEntity);
  const detailRepo = ds.getRepository(SaleDetailTypeOrmEntity);

  const existingCount = await saleRepo.count();
  if (existingCount >= TOTAL_SALES) {
    process.stdout.write(`  Ventas ya existen: ${existingCount} — omitiendo.\n`);
    return;
  }

  process.stdout.write(`\nInsertando ${TOTAL_SALES} ventas en lotes de ${BATCH_SIZE}...\n`);
  let insertedSales = 0;
  let insertedDetails = 0;

  for (let batch = 0; batch < TOTAL_SALES / BATCH_SIZE; batch++) {
    const sales: SaleTypeOrmEntity[] = [];
    const details: SaleDetailTypeOrmEntity[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i + 1;
      const saleId = randomUUID();

      const numProducts = randomInt(1, 2);
      const selectedProductIds = new Set<string>();
      while (selectedProductIds.size < numProducts) {
        selectedProductIds.add(randomItem(productIds));
      }

      let subtotal = 0;
      const saleItems: Array<{ productId: string; productName: string; productCode: string; quantity: number; unitPrice: number }> = [];

      for (const productId of selectedProductIds) {
        const quantity = randomInt(1, 5);
        const unitPrice = randomPrice(0.5, 999.99);
        subtotal += quantity * unitPrice;
        saleItems.push({
          productId,
          productName: fakerES.commerce.productName(),
          productCode: fakerES.string.alphanumeric(10).toUpperCase(),
          quantity,
          unitPrice,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const taxAmount = Math.round(subtotal * (taxRate.percentage / 100) * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      const sale = saleRepo.create({
        id: saleId,
        branchId,
        customerId: randomItem(customerIds),
        cashierUserId,
        saleNumber: `SAL-${String(index).padStart(6, '0')}`,
        paymentMethod: 'CASH',
        status: 'CONFIRMED',
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
      });

      sales.push(sale);

      saleItems.forEach((item, itemIndex) => {
        const lineSubtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        const lineTaxAmount = Math.round(lineSubtotal * (taxRate.percentage / 100) * 100) / 100;

        details.push(
          detailRepo.create({
            saleId,
            productId: item.productId,
            productNameSnapshot: item.productName,
            productCodeSnapshot: makeProductCode(index * 10 + itemIndex + 1),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRateId: taxRate.id,
            taxPercentage: taxRate.percentage,
            taxAmount: lineTaxAmount,
          } as SaleDetailTypeOrmEntity),
        );
      });
    }

    await saleRepo.save(sales);
    await detailRepo.save(details);

    insertedSales += sales.length;
    insertedDetails += details.length;
    process.stdout.write(
      `  Ventas: ${insertedSales}/${TOTAL_SALES} | Detalles: ${insertedDetails}\r`,
    );
  }

  process.stdout.write(`\n  ✓ Ventas completadas: ${insertedSales}\n`);
  process.stdout.write(`  ✓ Detalles completados: ${insertedDetails}\n`);
}

// ─────────────────────────────────────────────
// SERIES DE FACTURAS
// ─────────────────────────────────────────────
async function seedInvoiceSeries(
  seriesRepo: Repository<InvoiceSeriesTypeOrmEntity>,
  branchId: string,
): Promise<InvoiceSeriesTypeOrmEntity> {
  const existing = await seriesRepo.findOne({
    where: {
      branchId,
      establishmentCode: DEFAULT_ESTABLISHMENT_CODE,
      emissionPointCode: DEFAULT_EMISSION_POINT_CODE,
    },
  });

  if (existing) {
    if (!existing.isActive) {
      await seriesRepo.update(existing.id, { isActive: true });
      existing.isActive = true;
    }

    process.stdout.write(
      `  Serie de facturas ya existe: ${existing.establishmentCode}-${existing.emissionPointCode} — secuencia ${existing.currentSequence}\n`,
    );
    return existing;
  }

  const created = await seriesRepo.save(
    seriesRepo.create({
      id: randomUUID(),
      branchId,
      establishmentCode: DEFAULT_ESTABLISHMENT_CODE,
      emissionPointCode: DEFAULT_EMISSION_POINT_CODE,
      currentSequence: 0,
      isActive: true,
    }),
  );

  process.stdout.write(
    `  Serie de facturas creada: ${created.establishmentCode}-${created.emissionPointCode}\n`,
  );
  return created;
}

async function backfillInvoiceItemLots(ds: DataSource): Promise<number> {
  const invoiceRepo = ds.getRepository(InvoiceTypeOrmEntity);
  const invoiceItemRepo = ds.getRepository(InvoiceItemTypeOrmEntity);
  const invoiceItemLotRepo = ds.getRepository(InvoiceItemLotTypeOrmEntity);
  const lotRepo = ds.getRepository(LotTypeOrmEntity);
  const productRepo = ds.getRepository(ProductTypeOrmEntity);

  const missingCount = await invoiceItemRepo
    .createQueryBuilder('item')
    .leftJoin(InvoiceItemLotTypeOrmEntity, 'itemLot', 'itemLot.invoiceItemId = item.id')
    .where('itemLot.id IS NULL')
    .getCount();

  if (missingCount === 0) {
    process.stdout.write('  Trazabilidad por lotes ya existe para todos los items de factura — omitiendo.\n');
    return 0;
  }

  process.stdout.write(
    `\nBackfill de trazabilidad FIFO para ${missingCount} items de factura en lotes de ${BATCH_SIZE}...\n`,
  );

  let processed = 0;
  let created = 0;

  while (true) {
    const items = await invoiceItemRepo
      .createQueryBuilder('item')
      .leftJoin(InvoiceItemLotTypeOrmEntity, 'itemLot', 'itemLot.invoiceItemId = item.id')
      .where('itemLot.id IS NULL')
      .orderBy('item.invoiceId', 'ASC')
      .addOrderBy('item.id', 'ASC')
      .take(BATCH_SIZE)
      .getMany();

    if (items.length === 0) break;

    const productIds = [...new Set(items.map((item) => item.productId))];
    const lots = await lotRepo
      .createQueryBuilder('lot')
      .where('lot.productId IN (:...productIds)', { productIds })
      .andWhere('lot.deletedAt IS NULL')
      .andWhere('lot.quantityAvailable > 0')
      .orderBy('lot.receivedAt', 'ASC')
      .addOrderBy('lot.createdAt', 'ASC')
      .getMany();

    const lotsByProductId = new Map<string, LotTypeOrmEntity[]>();
    for (const lot of lots) {
      const productLots = lotsByProductId.get(lot.productId) ?? [];
      productLots.push(lot);
      lotsByProductId.set(lot.productId, productLots);
    }

    const invoiceItemLots: InvoiceItemLotTypeOrmEntity[] = [];
    const changedLots = new Map<string, LotTypeOrmEntity>();
    const consumedByProductId = new Map<string, number>();
    const profitByInvoiceId = new Map<string, number>();

    for (const item of items) {
      let remaining = Number(item.quantity);
      const productLots = lotsByProductId.get(item.productId) ?? [];

      for (const lot of productLots) {
        if (remaining <= 0) break;

        const available = Number(lot.quantityAvailable ?? 0);
        if (available <= 0) continue;

        const quantityUsed = Math.min(available, remaining);
        lot.quantityAvailable = Number((available - quantityUsed).toFixed(3));
        remaining = Number((remaining - quantityUsed).toFixed(3));

        const profitAmount = Math.round((Number(item.unitPrice) - Number(lot.unitCost)) * quantityUsed * 100) / 100;
        changedLots.set(lot.id, lot);
        consumedByProductId.set(
          item.productId,
          Number(((consumedByProductId.get(item.productId) ?? 0) + quantityUsed).toFixed(3)),
        );
        profitByInvoiceId.set(
          item.invoiceId,
          Math.round(((profitByInvoiceId.get(item.invoiceId) ?? 0) + profitAmount) * 100) / 100,
        );

        invoiceItemLots.push(
          invoiceItemLotRepo.create({
            id: randomUUID(),
            invoiceItemId: item.id,
            lotId: lot.id,
            quantityUsed,
            unitCostSnapshot: lot.unitCost,
            profitAmount,
          }),
        );
      }

      if (remaining > 0) {
        throw new Error(`Stock por lotes insuficiente para item de factura ${item.id}. Faltante: ${remaining}`);
      }
    }

    await invoiceItemLotRepo.insert(invoiceItemLots);

    if (changedLots.size > 0) {
      await lotRepo.save([...changedLots.values()]);
    }

    if (consumedByProductId.size > 0) {
      const consumedProducts = await productRepo.find({ where: { id: In([...consumedByProductId.keys()]) } });
      for (const product of consumedProducts) {
        product.currentStock = Math.max(
          0,
          Number((Number(product.currentStock ?? 0) - (consumedByProductId.get(product.id) ?? 0)).toFixed(3)),
        );
      }
      await productRepo.save(consumedProducts);
    }

    if (profitByInvoiceId.size > 0) {
      const invoices = await invoiceRepo.find({ where: { id: In([...profitByInvoiceId.keys()]) } });
      for (const invoice of invoices) {
        invoice.profitTotal = Math.round((Number(invoice.profitTotal ?? 0) + (profitByInvoiceId.get(invoice.id) ?? 0)) * 100) / 100;
      }
      await invoiceRepo.save(invoices);
    }

    processed += items.length;
    created += invoiceItemLots.length;
    process.stdout.write(`  Items procesados: ${processed}/${missingCount} | Asignaciones: ${created}\r`);
  }

  process.stdout.write(`\n  ✓ Backfill FIFO completado: ${created} asignaciones\n`);
  return created;
}

// ─────────────────────────────────────────────
// FACTURAS + ITEMS DESDE VENTAS + DETALLES
// ─────────────────────────────────────────────
async function seedInvoicesFromSales(
  ds: DataSource,
  series: InvoiceSeriesTypeOrmEntity,
): Promise<void> {
  const saleRepo = ds.getRepository(SaleTypeOrmEntity);
  const detailRepo = ds.getRepository(SaleDetailTypeOrmEntity);
  const invoiceRepo = ds.getRepository(InvoiceTypeOrmEntity);
  const invoiceItemRepo = ds.getRepository(InvoiceItemTypeOrmEntity);
  const invoiceItemLotRepo = ds.getRepository(InvoiceItemLotTypeOrmEntity);
  const lotRepo = ds.getRepository(LotTypeOrmEntity);
  const productRepo = ds.getRepository(ProductTypeOrmEntity);
  const seriesRepo = ds.getRepository(InvoiceSeriesTypeOrmEntity);

  const salesCount = await saleRepo.count({ where: { status: 'CONFIRMED' } });
  const existingInvoiceCount = await invoiceRepo.count({ where: { seriesId: series.id } });
  const missingInvoiceCount = await saleRepo
    .createQueryBuilder('sale')
    .leftJoin(InvoiceTypeOrmEntity, 'invoice', 'invoice.saleId = sale.id')
    .where('sale.status = :status', { status: 'CONFIRMED' })
    .andWhere('invoice.id IS NULL')
    .getCount();

  if (salesCount === 0) {
    process.stdout.write('  No hay ventas confirmadas para facturar — omitiendo.\n');
    return;
  }

  await backfillInvoiceItemLots(ds);

  if (missingInvoiceCount === 0) {
    process.stdout.write(`  Facturas ya existen para todas las ventas confirmadas: ${existingInvoiceCount} — omitiendo.\n`);
    return;
  }

  let nextSequence = Math.max(series.currentSequence, existingInvoiceCount);
  let insertedInvoices = 0;
  let insertedInvoiceItems = 0;

  process.stdout.write(
    `\nGenerando facturas para ventas confirmadas sin factura en lotes de ${BATCH_SIZE}...\n`,
  );

  while (true) {
    const sales = await saleRepo
      .createQueryBuilder('sale')
      .leftJoin(InvoiceTypeOrmEntity, 'invoice', 'invoice.saleId = sale.id')
      .where('sale.status = :status', { status: 'CONFIRMED' })
      .andWhere('invoice.id IS NULL')
      .orderBy('sale.createdAt', 'ASC')
      .addOrderBy('sale.saleNumber', 'ASC')
      .take(BATCH_SIZE)
      .getMany();

    if (sales.length === 0) break;

    const saleIds = sales.map((sale) => sale.id);
    const details = await detailRepo.find({ where: { saleId: In(saleIds) } });
    const productIds = [...new Set(details.map((detail) => detail.productId))];
    const detailsBySaleId = new Map<string, SaleDetailTypeOrmEntity[]>();

    for (const detail of details) {
      const saleDetails = detailsBySaleId.get(detail.saleId) ?? [];
      saleDetails.push(detail);
      detailsBySaleId.set(detail.saleId, saleDetails);
    }

    const lots = productIds.length === 0
      ? []
      : await lotRepo
        .createQueryBuilder('lot')
        .where('lot.productId IN (:...productIds)', { productIds })
        .andWhere('lot.deletedAt IS NULL')
        .andWhere('lot.quantityAvailable > 0')
        .orderBy('lot.receivedAt', 'ASC')
        .addOrderBy('lot.createdAt', 'ASC')
        .getMany();

    const lotsByProductId = new Map<string, LotTypeOrmEntity[]>();
    for (const lot of lots) {
      const productLots = lotsByProductId.get(lot.productId) ?? [];
      productLots.push(lot);
      lotsByProductId.set(lot.productId, productLots);
    }

    const invoices: InvoiceTypeOrmEntity[] = [];
    const invoiceItems: InvoiceItemTypeOrmEntity[] = [];
    const invoiceItemLots: InvoiceItemLotTypeOrmEntity[] = [];
    const changedLots = new Map<string, LotTypeOrmEntity>();
    const consumedByProductId = new Map<string, number>();

    for (const sale of sales) {
      const saleDetails = detailsBySaleId.get(sale.id) ?? [];
      if (saleDetails.length === 0) {
        continue;
      }

      nextSequence += 1;
      const invoiceId = randomUUID();
      let invoiceProfitTotal = 0;

      for (const detail of saleDetails) {
        const invoiceItemId = randomUUID();
        const quantity = Number(detail.quantity);
        invoiceItems.push(
          invoiceItemRepo.create({
            id: invoiceItemId,
            invoiceId,
            productId: detail.productId,
            productNameSnapshot: detail.productNameSnapshot,
            quantity,
            unitPrice: detail.unitPrice,
            taxRateId: detail.taxRateId,
            taxPercentage: detail.taxPercentage,
            taxAmount: detail.taxAmount,
          }),
        );

        let remaining = quantity;
        const productLots = lotsByProductId.get(detail.productId) ?? [];

        for (const lot of productLots) {
          if (remaining <= 0) break;
          const available = Number(lot.quantityAvailable ?? 0);
          if (available <= 0) continue;

          const quantityUsed = Math.min(available, remaining);
          lot.quantityAvailable = Number((available - quantityUsed).toFixed(3));
          remaining = Number((remaining - quantityUsed).toFixed(3));

          const profitAmount = Math.round((Number(detail.unitPrice) - Number(lot.unitCost)) * quantityUsed * 100) / 100;
          invoiceProfitTotal = Math.round((invoiceProfitTotal + profitAmount) * 100) / 100;
          changedLots.set(lot.id, lot);
          consumedByProductId.set(
            detail.productId,
            Number(((consumedByProductId.get(detail.productId) ?? 0) + quantityUsed).toFixed(3)),
          );

          invoiceItemLots.push(
            invoiceItemLotRepo.create({
              id: randomUUID(),
              invoiceItemId,
              lotId: lot.id,
              quantityUsed,
              unitCostSnapshot: lot.unitCost,
              profitAmount,
            }),
          );
        }

        if (remaining > 0) {
          throw new Error(`Stock por lotes insuficiente para producto ${detail.productId}. Faltante: ${remaining}`);
        }
      }

      invoices.push(
        invoiceRepo.create({
          id: invoiceId,
          saleId: sale.id,
          seriesId: series.id,
          invoiceNumber: makeInvoiceNumber(nextSequence),
          issueDate: sale.createdAt,
          status: 'ISSUED',
          profitTotal: invoiceProfitTotal,
        }),
      );
    }

    if (invoices.length === 0) break;

    await invoiceRepo.save(invoices);
    await invoiceItemRepo.save(invoiceItems);
    if (invoiceItemLots.length > 0) {
      await invoiceItemLotRepo.save(invoiceItemLots);
    }
    if (changedLots.size > 0) {
      await lotRepo.save([...changedLots.values()]);
    }
    if (consumedByProductId.size > 0) {
      const consumedProducts = await productRepo.find({ where: { id: In([...consumedByProductId.keys()]) } });
      for (const product of consumedProducts) {
        product.currentStock = Math.max(
          0,
          Number((Number(product.currentStock ?? 0) - (consumedByProductId.get(product.id) ?? 0)).toFixed(3)),
        );
      }
      await productRepo.save(consumedProducts);
    }

    insertedInvoices += invoices.length;
    insertedInvoiceItems += invoiceItems.length;

    process.stdout.write(
      `  Facturas: ${insertedInvoices}/${missingInvoiceCount} nuevas | Items: ${insertedInvoiceItems}\r`,
    );
  }

  await seriesRepo.update(series.id, { currentSequence: nextSequence });
  series.currentSequence = nextSequence;

  process.stdout.write(`\n  ✓ Facturas completadas: ${insertedInvoices}\n`);
  process.stdout.write(`  ✓ Items de factura completados: ${insertedInvoiceItems}\n`);
  process.stdout.write(`  ✓ Secuencia fiscal actualizada: ${nextSequence}\n`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main(): Promise<void> {
  process.stdout.write('Conectando a la base de datos...\n');
  dataSource.setOptions({
    logging: ['error', 'warn'],
    maxQueryExecutionTime: 1000,
  });
  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(CategoryTypeOrmEntity);
  const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);
  const productRepo = dataSource.getRepository(ProductTypeOrmEntity);
  const userRepo = dataSource.getRepository(UserTypeOrmEntity);
  const taxRateRepo = dataSource.getRepository(TaxRateTypeOrmEntity);
  const invoiceSeriesRepo = dataSource.getRepository(InvoiceSeriesTypeOrmEntity);

  const cashier = await userRepo.findOne({ where: { isActive: true } });
  if (!cashier) {
    throw new Error('No existe ningún usuario activo. Corre npm run db:seed:users primero.');
  }

  const taxRate = await taxRateRepo.findOne({ where: { isActive: true } });
  if (!taxRate) {
    throw new Error('No existe ningún tax rate activo. Corre npm run db:seed primero.');
  }

  const branchId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  process.stdout.write('Preparando categorías...\n');
  const categories = await seedCategories(categoryRepo, taxRateRepo);

  const customerIds = await seedCustomers(customerRepo);
  const productIds = await seedProducts(productRepo, categories);
  await seedLotsForProducts(dataSource);

  await seedSales(customerIds, productIds, cashier.id, branchId, taxRate, dataSource);
  const invoiceSeries = await seedInvoiceSeries(invoiceSeriesRepo, branchId);
  await seedInvoicesFromSales(dataSource, invoiceSeries);

  process.stdout.write('\n✓ Seed masivo completado.\n');
  process.stdout.write(`  Clientes  : ${TOTAL_CUSTOMERS.toLocaleString()}\n`);
  process.stdout.write(`  Productos : ${TOTAL_PRODUCTS.toLocaleString()}\n`);
  process.stdout.write(`  Ventas    : ${TOTAL_SALES.toLocaleString()}\n`);
  process.stdout.write(`  Facturas  : hasta ${TOTAL_SALES.toLocaleString()}\n`);
  process.stdout.write(
    `  Detalles  : entre ${TOTAL_SALES.toLocaleString()} y ${(TOTAL_SALES * 2).toLocaleString()}\n`,
  );
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  })
  .finally(() => dataSource.destroy());
