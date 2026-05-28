import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
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

// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────
const BATCH_SIZE = 500;
const TOTAL_CUSTOMERS = 100000;
const TOTAL_PRODUCTS = 100000;
const TOTAL_SALES = 100000;

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

function generateCedula(): string {
  return fakerES.string.numeric(10);
}

// ─────────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────────
async function seedCategories(
  categoryRepo: Repository<CategoryTypeOrmEntity>,
): Promise<CategoryTypeOrmEntity[]> {
  const existing = await categoryRepo.find();
  if (existing.length > 0) {
    process.stdout.write(`  Categorías ya existen: ${existing.length} — omitiendo.\n`);
    return existing;
  }

  const categories = CATEGORIES.map((name) =>
    categoryRepo.create({
      name,
      description: `Categoría de ${name}`,
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

  process.stdout.write(`\nInsertando ${TOTAL_CUSTOMERS} clientes en lotes de ${BATCH_SIZE}...\n`);
  const allIds: string[] = [];

  for (let batch = 0; batch < TOTAL_CUSTOMERS / BATCH_SIZE; batch++) {
    const customers = Array.from({ length: BATCH_SIZE }, () =>
      customerRepo.create({
        cedula: generateCedula(),
        firstName: fakerES.person.firstName(),
        lastName: fakerES.person.lastName(),
        email: fakerES.internet.email(),
        phone: fakerES.phone.number(),
        address: fakerES.location.streetAddress(),
        isActive: true,
      }),
    );

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
    const products = Array.from({ length: BATCH_SIZE }, () => {
      const salePrice = randomPrice(0.5, 999.99);
      return productRepo.create({
        categoryId: randomItem(categories).id,
        code: fakerES.string.alphanumeric(10).toUpperCase(),
        name: fakerES.commerce.productName(),
        description: fakerES.commerce.productDescription(),
        salePrice,
        costPrice: Math.round(salePrice * 0.6 * 100) / 100,
        currentStock: randomInt(10, 500),
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

// ─────────────────────────────────────────────
// VENTAS + DETALLES
// ─────────────────────────────────────────────
async function seedSales(
  customerIds: string[],
  productIds: string[],
  cashierUserId: string,
  branchId: string,
  taxRateId: string,
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
      const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      const sale = saleRepo.create({
        id: saleId,
        branchId,
        customerId: randomItem(customerIds),
        cashierUserId,
        taxRateId,
        saleNumber: `SAL-${String(index).padStart(10, '0')}`,
        paymentMethod: 'CASH',
        status: 'CONFIRMED',
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
      });

      sales.push(sale);

      saleItems.forEach((item) => {
        details.push(
          detailRepo.create({
            saleId,
            productId: item.productId,
            productNameSnapshot: item.productName,
            productCodeSnapshot: item.productCode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
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
// MAIN
// ─────────────────────────────────────────────
async function main(): Promise<void> {
  process.stdout.write('Conectando a la base de datos...\n');
  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(CategoryTypeOrmEntity);
  const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);
  const productRepo = dataSource.getRepository(ProductTypeOrmEntity);
  const userRepo = dataSource.getRepository(UserTypeOrmEntity);
  const taxRateRepo = dataSource.getRepository(TaxRateTypeOrmEntity);

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
  const categories = await seedCategories(categoryRepo);

  const customerIds = await seedCustomers(customerRepo);
  const productIds = await seedProducts(productRepo, categories);

  await seedSales(customerIds, productIds, cashier.id, branchId, taxRate.id, dataSource);

  process.stdout.write('\n✓ Seed masivo completado.\n');
  process.stdout.write(`  Clientes  : ${TOTAL_CUSTOMERS.toLocaleString()}\n`);
  process.stdout.write(`  Productos : ${TOTAL_PRODUCTS.toLocaleString()}\n`);
  process.stdout.write(`  Ventas    : ${TOTAL_SALES.toLocaleString()}\n`);
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