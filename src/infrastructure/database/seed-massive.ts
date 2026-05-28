import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { v5 as uuidv5 } from 'uuid';
import { Repository } from 'typeorm';
import { dataSource } from '../../config/typeorm.config';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from './entities/product.typeorm.entity';
import { CategoryTypeOrmEntity } from './entities/category.typeorm.entity';
import { TaxRateTypeOrmEntity } from './entities/tax-rate.typeorm.entity';

const UUID_NAMESPACE = 'f8d1f8a7-8b36-4a6f-9e9a-7d8e7a7f6c01';

const BATCH_SIZE = 1000;
const TOTAL_CUSTOMERS = 50000;
const TOTAL_PRODUCTS = 50000;

const FIRST_NAMES = ['Carlos', 'María', 'Juan', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Laura', 'Diego', 'Gabriela'];
const LAST_NAMES = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores'];
const PRODUCT_PREFIXES = ['Pro', 'Item', 'Art', 'Prod', 'Obj'];
const CATEGORIES = ['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateCedula(index: number): string {
  return String(index).padStart(10, '0');
}

async function seedCategories(
  categoryRepo: Repository<CategoryTypeOrmEntity>,
  taxRateRepo: Repository<TaxRateTypeOrmEntity>,
): Promise<CategoryTypeOrmEntity[]> {
  const existing = await categoryRepo.find();
  if (existing.length > 0) return existing;

  const defaultTaxRateId = uuidv5('IVA 15%', UUID_NAMESPACE);

  const categories = CATEGORIES.map(name =>
    categoryRepo.create({ id: randomUUID(), name, description: `Categoría de ${name}`, isActive: true, taxRateId: defaultTaxRateId }),
  );

  await categoryRepo.save(categories);
  process.stdout.write(`  Categorías creadas: ${categories.length}\n`);
  return categories;
}

async function seedCustomers(
  customerRepo: Repository<CustomerTypeOrmEntity>,
): Promise<void> {
  process.stdout.write(`\nInsertando ${TOTAL_CUSTOMERS} clientes en lotes de ${BATCH_SIZE}...\n`);

  let inserted = 0;
  for (let batch = 0; batch < TOTAL_CUSTOMERS / BATCH_SIZE; batch++) {
    const customers: CustomerTypeOrmEntity[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i + 1;
      customers.push(
        customerRepo.create({
          id: randomUUID(),
          cedula: generateCedula(index),
          firstName: randomItem(FIRST_NAMES),
          lastName: randomItem(LAST_NAMES),
          email: `cliente${index}@test.com`,
          phone: `09${String(randomInt(10000000, 99999999))}`,
          address: `Calle ${randomInt(1, 100)} y Av. ${randomInt(1, 50)}`,
          isActive: true,
        }),
      );
    }
    await customerRepo.save(customers);
    inserted += customers.length;
    process.stdout.write(`  Clientes insertados: ${inserted}/${TOTAL_CUSTOMERS}\r`);
  }
  process.stdout.write(`\n  ✓ Clientes completados: ${inserted}\n`);
}

async function seedProducts(
  productRepo: Repository<ProductTypeOrmEntity>,
  categories: CategoryTypeOrmEntity[],
): Promise<void> {
  process.stdout.write(`\nInsertando ${TOTAL_PRODUCTS} productos en lotes de ${BATCH_SIZE}...\n`);

  let inserted = 0;
  for (let batch = 0; batch < TOTAL_PRODUCTS / BATCH_SIZE; batch++) {
    const products: ProductTypeOrmEntity[] = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i + 1;
      const salePrice = randomInt(100, 9999);
      products.push(
        productRepo.create({
          id: randomUUID(),
          categoryId: randomItem(categories).id,
          code: `COD-${String(index).padStart(8, '0')}`,
          name: `${randomItem(PRODUCT_PREFIXES)} ${index}`,
          description: `Descripción del producto ${index}`,
          salePrice,
          costPrice: Math.round(salePrice * 0.6),
          currentStock: randomInt(0, 500),
          isActive: true,
        }),
      );
    }
    await productRepo.save(products);
    inserted += products.length;
    process.stdout.write(`  Productos insertados: ${inserted}/${TOTAL_PRODUCTS}\r`);
  }
  process.stdout.write(`\n  ✓ Productos completados: ${inserted}\n`);
}

async function main(): Promise<void> {
  process.stdout.write('Conectando a la base de datos...\n');
  await dataSource.initialize();

  const categoryRepo = dataSource.getRepository(CategoryTypeOrmEntity);
  const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);
  const productRepo = dataSource.getRepository(ProductTypeOrmEntity);
  const taxRateRepo = dataSource.getRepository(TaxRateTypeOrmEntity);

  process.stdout.write('Preparando categorías...\n');
  const categories = await seedCategories(categoryRepo, taxRateRepo);

  await seedCustomers(customerRepo);
  await seedProducts(productRepo, categories);

  process.stdout.write('\n✓ Script masivo completado: 100,000 registros insertados.\n');
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  })
  .finally(() => dataSource.destroy());