import 'reflect-metadata';
//import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
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
const BATCH_SIZE = 500; // Reducido para que repository.save() no sature la memoria
const TOTAL_CUSTOMERS = 100000;
const TOTAL_PRODUCTS = 100000;
const TOTAL_SALES = 100000;

const CATEGORIES = [
  'Electrónica', 'Ropa', 'Alimentos', 'Hogar',
  'Deportes', 'Bebidas', 'Limpieza', 'Panadería',
  'Lácteos', 'Carnes',
];

// ─────────────────────────────────────────────
// UTILIDADES (sin dependencias externas)
// ─────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateCedula(index: number): string {
  return String(index).padStart(10, '0');
}

function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
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

  // repository.create() + repository.save() → siempre respeta el mapeo de columnas
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
    const customers = Array.from({ length: BATCH_SIZE }, (_, i) => {
      const index = batch * BATCH_SIZE + i + 1;
      // Usar siempre repository.create() para que TypeORM aplique
      // el mapeo de metadatos (column names, defaults, transformers)
      // independientemente del motor de base de datos subyacente.
      return customerRepo.create({
        cedula: generateCedula(index),
        firstName: `Nombre${index}`,
        lastName: `Apellido${index}`,
        email: `cliente${index}@test.com`,
        phone: `09${String(randomInt(10000000, 99999999))}`,
        address: `Calle ${randomInt(1, 100)} y Av. ${randomInt(1, 50)}`,
        isActive: true,
      });
    });

    // repository.save() delega al EntityManager del driver activo,
    // aplica todos los @Column({ name: '...' }) y @BeforeInsert hooks.
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
    const products = Array.from({ length: BATCH_SIZE }, (_, i) => {
      const index = batch * BATCH_SIZE + i + 1;
      const salePrice = randomPrice(0.5, 999.99);
      return productRepo.create({
        categoryId: randomItem(categories).id,
        code: `COD-${String(index).padStart(8, '0')}`,
        name: `Producto ${index}`,
        description: `Descripción del producto ${index}`,
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

      // Seleccionar entre 1 y 2 productos únicos para la venta
      const numProducts = randomInt(1, 2);
      const selectedProductIds = new Set<string>();
      while (selectedProductIds.size < numProducts) {
        selectedProductIds.add(randomItem(productIds));
      }

      let subtotal = 0;
      const saleItems: Array<{ productId: string; quantity: number; unitPrice: number }> = [];

      for (const productId of selectedProductIds) {
        const quantity = randomInt(1, 5);
        const unitPrice = randomPrice(0.5, 999.99);
        subtotal += quantity * unitPrice;
        saleItems.push({ productId, quantity, unitPrice });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;

      // ✅ CLAVE: repository.create() construye la entidad a través del
      // EntityMetadata del ORM, por lo que los nombres de columna (@Column name),
      // transformers, y defaults se aplican siempre, sin importar si el
      // motor es PostgreSQL, MySQL, SQLite u otro.
      const sale = saleRepo.create({
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

      // Los detalles se crean DESPUÉS de tener la referencia de la venta.
      // Como aún no tenemos el id (pre-insert), los añadimos post-save.
      saleItems.forEach((item) => {
        details.push(
          detailRepo.create({
            // saleId se asignará tras guardar las ventas (ver abajo)
            productId: item.productId,
            productNameSnapshot: `Producto ${item.productId.slice(0, 8)}`,
            productCodeSnapshot: `COD-${String(index).padStart(8, '0')}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            // Guardamos el índice para poder mapear post-save
            __saleIndex: i, // propiedad temporal, no persistida
          } as SaleDetailTypeOrmEntity & { __saleIndex: number }),
        );
      });
    }

    // 1. Guardar ventas → el ORM genera los UUIDs y aplica @PrimaryGeneratedColumn
    const savedSales = await saleRepo.save(sales);

    // 2. Asignar el saleId real a cada detalle usando el índice temporal
    const detailsWithSaleId = details.map((detail) => {
      const idx = (detail as SaleDetailTypeOrmEntity & { __saleIndex: number }).__saleIndex;
      detail.saleId = savedSales[idx].id;
      return detail;
    });

    // 3. Guardar detalles con el saleId correcto
    await detailRepo.save(detailsWithSaleId);

    insertedSales += savedSales.length;
    insertedDetails += detailsWithSaleId.length;
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