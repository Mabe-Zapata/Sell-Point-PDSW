import 'reflect-metadata';
import { DataSource, Repository, DeepPartial } from 'typeorm';
import { fakerES } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { dataSource } from '../../config/typeorm.config';
import { UserTypeOrmEntity } from './entities/user.typeorm.entity';
import { UserRoleTypeOrmEntity } from './entities/user-role.typeorm.entity';
import { RoleTypeOrmEntity } from './entities/role.typeorm.entity';
import { TaxRateTypeOrmEntity } from './entities/tax-rate.typeorm.entity';
import { CategoryTypeOrmEntity } from './entities/category.typeorm.entity';
import { ProductTypeOrmEntity } from './entities/product.typeorm.entity';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from './entities/invoice-series.typeorm.entity';
import { SaleTypeOrmEntity } from './entities/sale.typeorm.entity';
import { SaleDetailTypeOrmEntity } from './entities/sale-detail.typeorm.entity';
import { InvoiceTypeOrmEntity } from './entities/invoice.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from './entities/invoice-item.typeorm.entity';

// ─────────────────────────────────────────────
// CONFIGURACIÓN (small scale — dev / staging friendly)
// ─────────────────────────────────────────────
const SMALL_TAX_RATES = 5;
const SMALL_CATEGORIES = 10;
const SMALL_PRODUCTS_PER_CATEGORY = 10;     // → 100 products total
const SMALL_CUSTOMERS = 100;
const SMALL_USERS = 10;
const SMALL_INVOICE_SERIES = 1;
const SMALL_SALES = 100;
const SMALL_SALE_DETAILS_PER_SALE = 3;      // → 300 sale details total

const DEFAULT_BRANCH_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const DEFAULT_ESTABLISHMENT_CODE = '001';
const DEFAULT_EMISSION_POINT_CODE = '001';

const CATEGORIES = [
  'Electrónica', 'Ropa', 'Alimentos', 'Hogar',
  'Deportes', 'Bebidas', 'Limpieza', 'Panadería',
  'Lácteos', 'Carnes',
];

const ROLES = ['ADMIN', 'VENDEDOR', 'CAJERO', 'BODEGA'];

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
  return String(8000000000 + sequence);
}

function makeCustomerEmail(sequence: number): string {
  return `seed.customer.${sequence}@billflow.local`;
}

function makeEmployeeId(sequence: number): string {
  return `EMP-${String(sequence).padStart(8, '0')}`;
}

function makeInvoiceNumber(sequence: number): string {
  return `${DEFAULT_ESTABLISHMENT_CODE}-${DEFAULT_EMISSION_POINT_CODE}-${String(sequence).padStart(9, '0')}`;
}

// ─────────────────────────────────────────────
// TAX RATES
// ─────────────────────────────────────────────
async function seedTaxRates(repo: Repository<TaxRateTypeOrmEntity>): Promise<TaxRateTypeOrmEntity[]> {
  const existing = await repo.count();
  if (existing >= SMALL_TAX_RATES) {
    const all = await repo.find();
    process.stdout.write(`  Tax rates ya existen: ${existing} — omitiendo.\n`);
    return all;
  }

  const rates: TaxRateTypeOrmEntity[] = [];
  const labels = ['IVA 0%', 'IVA 12%', 'IVA 15%', 'Exento', 'IVA 5%'];
  for (let i = 0; i < SMALL_TAX_RATES; i++) {
    rates.push(repo.create({
      name: labels[i] ?? `Tax ${i + 1}`,
      percentage: i === 0 ? 0 : i === 1 ? 12 : i === 2 ? 15 : i === 3 ? 0 : 5,
      isActive: true,
    }));
  }
  await repo.save(rates);
  process.stdout.write(`  Tax rates creadas: ${rates.length}\n`);
  return rates;
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
async function seedCategories(
  repo: Repository<CategoryTypeOrmEntity>,
  taxRate: TaxRateTypeOrmEntity,
): Promise<CategoryTypeOrmEntity[]> {
  const existing = await repo.count();
  if (existing >= SMALL_CATEGORIES) {
    const all = await repo.find();
    process.stdout.write(`  Categorías ya existen: ${existing} — omitiendo.\n`);
    return all;
  }

  const categories = CATEGORIES.map((name) =>
    repo.create({
      name,
      description: `Categoría de ${name}`,
      taxRateId: taxRate.id,
      isActive: true,
    }),
  );
  await repo.save(categories);
  process.stdout.write(`  Categorías creadas: ${categories.length}\n`);
  return categories;
}

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────
async function seedProducts(
  repo: Repository<ProductTypeOrmEntity>,
  categories: CategoryTypeOrmEntity[],
): Promise<string[]> {
  const existing = await repo.count();
  if (existing >= SMALL_CATEGORIES * SMALL_PRODUCTS_PER_CATEGORY) {
    const all = await repo.find({ select: ['id'] });
    process.stdout.write(`  Productos ya existen: ${existing} — omitiendo.\n`);
    return all.map((p) => p.id);
  }

  const products: ProductTypeOrmEntity[] = [];
  let sequence = 1;
  for (const category of categories) {
    for (let i = 0; i < SMALL_PRODUCTS_PER_CATEGORY; i++) {
      const salePrice = randomPrice(0.5, 999.99);
      products.push(repo.create({
        id: randomUUID(),
        categoryId: category.id,
        code: makeProductCode(sequence),
        name: fakerES.commerce.productName(),
        description: fakerES.commerce.productDescription(),
        salePrice,
        costPrice: Math.round(salePrice * 0.6 * 100) / 100,
        currentStock: randomInt(10, 200),
        isActive: true,
      }));
      sequence += 1;
    }
  }
  await repo.save(products);
  process.stdout.write(`  Productos creados: ${products.length}\n`);
  return products.map((p) => p.id);
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────
async function seedCustomers(repo: Repository<CustomerTypeOrmEntity>): Promise<string[]> {
  const existing = await repo.count();
  if (existing >= SMALL_CUSTOMERS) {
    const all = await repo.find({ select: ['id'] });
    process.stdout.write(`  Clientes ya existen: ${existing} — omitiendo.\n`);
    return all.map((c) => c.id);
  }

  const usedCedulas = new Set<string>();
  const usedEmails = new Set<string>();
  const customers: CustomerTypeOrmEntity[] = [];
  let sequence = 1;

  while (customers.length < SMALL_CUSTOMERS) {
    const cedula = makeCedula(sequence);
    const email = makeCustomerEmail(sequence);
    sequence += 1;
    if (usedCedulas.has(cedula) || usedEmails.has(email)) continue;
    usedCedulas.add(cedula);
    usedEmails.add(email);
    customers.push(repo.create({
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

  await repo.save(customers);
  process.stdout.write(`  Clientes creados: ${customers.length}\n`);
  return customers.map((c) => c.id);
}

// ─────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────
async function seedRoles(repo: Repository<RoleTypeOrmEntity>): Promise<RoleTypeOrmEntity[]> {
  const existing = await repo.count();
  if (existing >= ROLES.length) {
    const all = await repo.find();
    process.stdout.write(`  Roles ya existen: ${existing} — omitiendo.\n`);
    return all;
  }
  const roles = ROLES.map((name) =>
    repo.create({ name, description: `Role ${name}` }),
  );
  await repo.save(roles);
  process.stdout.write(`  Roles creados: ${roles.length}\n`);
  return roles;
}

// ─────────────────────────────────────────────
// USERS (employees with defaultBranchId)
// ─────────────────────────────────────────────
async function seedUsers(
  repo: Repository<UserTypeOrmEntity>,
  userRoleRepo: Repository<UserRoleTypeOrmEntity>,
  roles: RoleTypeOrmEntity[],
): Promise<string[]> {
  const existing = await repo.count();
  if (existing >= SMALL_USERS) {
    const all = await repo.find({ select: ['id'] });
    process.stdout.write(`  Usuarios ya existen: ${existing} — omitiendo.\n`);
    return all.map((u) => u.id);
  }

  const users: UserTypeOrmEntity[] = [];
  const userRoles: UserRoleTypeOrmEntity[] = [];
  let sequence = 1;
  for (let i = 0; i < SMALL_USERS; i++) {
    const role = roles[i % roles.length];
    const userId = randomUUID();
    const firstName = fakerES.person.firstName();
    const lastName = fakerES.person.lastName();
    const email = `seed.user.${sequence}@billflow.local`;
    const username = email;
    users.push(repo.create({
      id: userId,
      employeeId: makeEmployeeId(sequence),
      email,
      username,
      firstName,
      lastName,
      cedula: makeCedula(sequence + 10000),
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKL.', // dummy hash; no login
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      passwordExpired: true,
      defaultBranchId: DEFAULT_BRANCH_ID,
    }));
    userRoles.push(userRoleRepo.create({
      userId,
      roleId: role.id,
    } as DeepPartial<UserRoleTypeOrmEntity>));
    sequence += 1;
  }
  await repo.save(users);
  await userRoleRepo.save(userRoles);
  process.stdout.write(`  Usuarios creados: ${users.length}\n`);
  return users.map((u) => u.id);
}

// ─────────────────────────────────────────────
// INVOICE SERIES
// ─────────────────────────────────────────────
async function seedInvoiceSeries(repo: Repository<InvoiceSeriesTypeOrmEntity>): Promise<InvoiceSeriesTypeOrmEntity> {
  const existing = await repo.count();
  if (existing >= SMALL_INVOICE_SERIES) {
    const all = await repo.find();
    process.stdout.write(`  Invoice series ya existen: ${existing} — omitiendo.\n`);
    return all[0];
  }
  const series = repo.create({
    id: randomUUID(),
    branchId: DEFAULT_BRANCH_ID,
    establishmentCode: DEFAULT_ESTABLISHMENT_CODE,
    emissionPointCode: DEFAULT_EMISSION_POINT_CODE,
    currentSequence: 0,
    isActive: true,
  });
  await repo.save(series);
  process.stdout.write(`  Invoice series creada: ${series.establishmentCode}-${series.emissionPointCode}\n`);
  return series;
}

// ─────────────────────────────────────────────
// SALES + SALE DETAILS + INVOICES + INVOICE ITEMS
// ─────────────────────────────────────────────
async function seedSales(
  ds: DataSource,
  customerIds: string[],
  productIds: string[],
  cashierUserIds: string[],
  invoiceSeries: InvoiceSeriesTypeOrmEntity,
  taxRate: TaxRateTypeOrmEntity,
): Promise<void> {
  const saleRepo = ds.getRepository(SaleTypeOrmEntity);
  const detailRepo = ds.getRepository(SaleDetailTypeOrmEntity);
  const invoiceRepo = ds.getRepository(InvoiceTypeOrmEntity);
  const invoiceItemRepo = ds.getRepository(InvoiceItemTypeOrmEntity);

  const existing = await saleRepo.count();
  if (existing >= SMALL_SALES) {
    process.stdout.write(`  Ventas ya existen: ${existing} — omitiendo.\n`);
    return;
  }

  const sales: SaleTypeOrmEntity[] = [];
  const details: SaleDetailTypeOrmEntity[] = [];
  const invoices: InvoiceTypeOrmEntity[] = [];
  const invoiceItems: InvoiceItemTypeOrmEntity[] = [];

  for (let i = 0; i < SMALL_SALES; i++) {
    const saleId = randomUUID();
    const cashierId = randomItem(cashierUserIds);

    const numDetails = randomInt(1, SMALL_SALE_DETAILS_PER_SALE);
    const selectedProductIds = new Set<string>();
    while (selectedProductIds.size < numDetails) {
      selectedProductIds.add(randomItem(productIds));
    }

    const saleDetailsList: Array<{
      productId: string; productName: string; productCode: string;
      quantity: number; unitPrice: number;
    }> = [];
    let subtotal = 0;

    for (const productId of selectedProductIds) {
      const quantity = randomInt(1, 5);
      const unitPrice = randomPrice(0.5, 999.99);
      subtotal += quantity * unitPrice;
      saleDetailsList.push({
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

    sales.push(saleRepo.create({
      id: saleId,
      branchId: DEFAULT_BRANCH_ID,
      customerId: randomItem(customerIds),
      cashierUserId: cashierId,
      saleNumber: `SAL-${String(i + 1).padStart(6, '0')}`,
      paymentMethod: 'CASH',
      status: 'CONFIRMED',
      subtotal,
      taxAmount,
      discountAmount: 0,
      total,
    }));

    const invoiceSequence = invoiceSeries.currentSequence + i + 1;
    invoices.push(invoiceRepo.create({
      saleId,
      seriesId: invoiceSeries.id,
      invoiceNumber: makeInvoiceNumber(invoiceSequence),
      issueDate: new Date(),
      status: 'ISSUED',
      customerNameSnapshot: 'Consumidor Final',
      customerCedulaSnapshot: null,
      customerEmailSnapshot: null,
      cashierNameSnapshot: 'Seed User',
      cashierUsernameSnapshot: 'seed.user',
      cashierEmployeeIdSnapshot: 'EMP-00000001',
    } as unknown as DeepPartial<InvoiceTypeOrmEntity>));

    saleDetailsList.forEach((item) => {
      const lineSubtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const lineTaxAmount = Math.round(lineSubtotal * (taxRate.percentage / 100) * 100) / 100;
      const detailId = randomUUID();
      const invoiceItemId = randomUUID();

      details.push(detailRepo.create({
        saleId,
        productId: item.productId,
        productNameSnapshot: item.productName,
        productCodeSnapshot: item.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRateId: taxRate.id,
        taxPercentage: taxRate.percentage,
        taxAmount: lineTaxAmount,
      }));

      invoiceItems.push(invoiceItemRepo.create({
        id: invoiceItemId,
        invoiceId: invoices[invoices.length - 1].id,
        productId: item.productId,
        productNameSnapshot: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRateId: taxRate.id,
        taxPercentage: taxRate.percentage,
        taxAmount: lineTaxAmount,
      }));
    });
  }

  await saleRepo.save(sales);
  await detailRepo.save(details);
  await invoiceRepo.save(invoices);
  await invoiceItemRepo.save(invoiceItems);
  process.stdout.write(`  Ventas creadas: ${sales.length} (con ${details.length} detalles y ${invoices.length} facturas)\n`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main(): Promise<void> {
  process.stdout.write('\n════════════════════════════════════════\n');
  process.stdout.write('  SellPoint — Small Seed (~100 per table)\n');
  process.stdout.write(`  Branch: ${DEFAULT_BRANCH_ID}\n`);
  process.stdout.write('════════════════════════════════════════\n\n');

  await dataSource.initialize();

  try {
    const taxRateRepo = dataSource.getRepository(TaxRateTypeOrmEntity);
    const categoryRepo = dataSource.getRepository(CategoryTypeOrmEntity);
    const productRepo = dataSource.getRepository(ProductTypeOrmEntity);
    const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);
    const userRepo = dataSource.getRepository(UserTypeOrmEntity);
    const userRoleRepo = dataSource.getRepository(UserRoleTypeOrmEntity);
    const roleRepo = dataSource.getRepository(RoleTypeOrmEntity);
    const invoiceSeriesRepo = dataSource.getRepository(InvoiceSeriesTypeOrmEntity);

    const taxRates = await seedTaxRates(taxRateRepo);
    const primaryTaxRate = taxRates.find((r) => r.percentage === 15) ?? taxRates[0];
    const categories = await seedCategories(categoryRepo, primaryTaxRate);
    const productIds = await seedProducts(productRepo, categories);
    const customerIds = await seedCustomers(customerRepo);
    const roles = await seedRoles(roleRepo);
    const userIds = await seedUsers(userRepo, userRoleRepo, roles);
    const invoiceSeries = await seedInvoiceSeries(invoiceSeriesRepo);

    await seedSales(
      dataSource,
      customerIds,
      productIds,
      userIds,
      invoiceSeries,
      primaryTaxRate,
    );

    process.stdout.write('\n✓ Seed small completado.\n');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  process.stderr.write(`Error en seed-small: ${err}\n`);
  process.exit(1);
});
