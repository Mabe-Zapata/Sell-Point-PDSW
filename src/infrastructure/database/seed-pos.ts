import 'reflect-metadata';
import { v5 as uuidv5 } from 'uuid';
import { randomUUID } from 'crypto';
import { dataSource } from '../../config/typeorm.config';
import { CategoryTypeOrmEntity } from './entities/category.typeorm.entity';
import { ProductTypeOrmEntity } from './entities/product.typeorm.entity';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';
import { TaxRateTypeOrmEntity } from './entities/tax-rate.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from './entities/invoice-series.typeorm.entity';

const UUID_NAMESPACE = 'f8d1f8a7-8b36-4a6f-9e9a-7d8e7a7f6c01';

function makeProductCode(seed: string): string {
  return `PROD-${uuidv5(seed, UUID_NAMESPACE).replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}

async function main() {
  await dataSource.initialize();
  console.log('Database connected for POS seed.');

  const categoryRepo = dataSource.getRepository(CategoryTypeOrmEntity);
  const productRepo = dataSource.getRepository(ProductTypeOrmEntity);
  const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);
  const taxRateRepo = dataSource.getRepository(TaxRateTypeOrmEntity);

  // Look up tax rates (created by seed.ts with deterministic UUIDv5)
  const iva15Id = uuidv5('IVA 15%', UUID_NAMESPACE);
  const iva0Id = uuidv5('IVA 0%', UUID_NAMESPACE);
  const defaultTaxRateId = iva15Id;

  // 1. Seed Categories
  const categoriesData: Array<{ name: string; description: string; taxRateId?: string }> = [
    { name: 'Bebidas', description: 'Gaseosas, jugos y aguas' },
    { name: 'Snacks', description: 'Papas, galletas y chucherías' },
    { name: 'Lácteos', description: 'Leche, yogurt y quesos' },
    { name: 'Carnes', description: 'Res, pollo y cerdo' },
    { name: 'Granos Básicos', description: 'Arroz, azúcar, fideos' },
    { name: 'Limpieza', description: 'Detergentes, jabones y cloro' },
    { name: 'Panadería', description: 'Pan, pasteles y empanadas' },
  ];

  // Assign IVA 15% by default; Granos Básicos with IVA 0% (basic basket)
  const categoriesWithTax = categoriesData.map((c) => ({
    ...c,
    taxRateId: c.name === 'Granos Básicos' ? iva0Id : defaultTaxRateId,
  }));

  const savedCategories: CategoryTypeOrmEntity[] = [];

  for (const catData of categoriesWithTax) {
    let category = await categoryRepo.findOne({ where: { name: catData.name } });
    if (category) {
      const needsUpdate = category.taxRateId !== catData.taxRateId;
      if (needsUpdate) {
        await categoryRepo.update(category.id, { taxRateId: catData.taxRateId });
        category.taxRateId = catData.taxRateId;
        console.log(`Category "${catData.name}" tax rate updated.`);
      } else {
        console.log(`Category "${catData.name}" already exists, skipping.`);
      }
    } else {
      category = await categoryRepo.save(
        categoryRepo.create({ id: randomUUID(), ...catData, isActive: true }),
      );
      console.log(`Category "${catData.name}" created with tax rate.`);
    }
    savedCategories.push(category);
  }

  // 2. Seed Products
  const productsData = [
    // Bebidas (category 0)
    { code: makeProductCode('BEB-001'), name: 'Coca Cola 500ml', salePrice: 1.50, costPrice: 1.00, stock: 100, categoryIndex: 0 },
    { code: makeProductCode('BEB-002'), name: 'Sprite 500ml', salePrice: 1.50, costPrice: 1.00, stock: 80, categoryIndex: 0 },
    { code: makeProductCode('BEB-003'), name: 'Agua Sin Gas 600ml', salePrice: 1.00, costPrice: 0.60, stock: 120, categoryIndex: 0 },
    { code: makeProductCode('BEB-004'), name: 'Jugo Natural Naranja 1L', salePrice: 2.50, costPrice: 1.80, stock: 40, categoryIndex: 0 },
    { code: makeProductCode('BEB-005'), name: 'Cerveza Pilsener 355ml', salePrice: 2.00, costPrice: 1.20, stock: 60, categoryIndex: 0 },
    // Snacks (category 1)
    { code: makeProductCode('SNK-001'), name: 'Papas Lays Clásicas 40g', salePrice: 0.80, costPrice: 0.50, stock: 200, categoryIndex: 1 },
    { code: makeProductCode('SNK-002'), name: 'Galletas Oreo 120g', salePrice: 1.20, costPrice: 0.80, stock: 150, categoryIndex: 1 },
    { code: makeProductCode('SNK-003'), name: 'Chifles Verde 60g', salePrice: 1.00, costPrice: 0.60, stock: 90, categoryIndex: 1 },
    { code: makeProductCode('SNK-004'), name: 'Chocolate Nacional 50g', salePrice: 1.50, costPrice: 1.00, stock: 75, categoryIndex: 1 },
    // Lácteos (category 2)
    { code: makeProductCode('LAC-001'), name: 'Leche Entera 1L', salePrice: 1.20, costPrice: 0.90, stock: 100, categoryIndex: 2 },
    { code: makeProductCode('LAC-002'), name: 'Yogurt Natural 1L', salePrice: 2.00, costPrice: 1.40, stock: 50, categoryIndex: 2 },
    { code: makeProductCode('LAC-003'), name: 'Queso Fresco 500g', salePrice: 3.50, costPrice: 2.50, stock: 30, categoryIndex: 2 },
    // Carnes (category 3)
    { code: makeProductCode('CAR-001'), name: 'Pechuga de Pollo 1kg', salePrice: 4.50, costPrice: 3.20, stock: 40, categoryIndex: 3 },
    { code: makeProductCode('CAR-002'), name: 'Carne Molida 1kg', salePrice: 5.00, costPrice: 3.80, stock: 35, categoryIndex: 3 },
    // Granos Básicos (category 4)
    { code: makeProductCode('GRA-001'), name: 'Arroz Premium 1kg', salePrice: 1.10, costPrice: 0.80, stock: 200, categoryIndex: 4 },
    { code: makeProductCode('GRA-002'), name: 'Azúcar Blanca 1kg', salePrice: 1.00, costPrice: 0.70, stock: 180, categoryIndex: 4 },
    { code: makeProductCode('GRA-003'), name: 'Fideos Tallarín 500g', salePrice: 0.90, costPrice: 0.60, stock: 160, categoryIndex: 4 },
    { code: makeProductCode('GRA-004'), name: 'Aceite Vegetal 1L', salePrice: 2.80, costPrice: 2.00, stock: 60, categoryIndex: 4 },
    // Limpieza (category 5)
    { code: makeProductCode('LIM-001'), name: 'Detergente Líquido 750ml', salePrice: 3.00, costPrice: 2.10, stock: 45, categoryIndex: 5 },
    { code: makeProductCode('LIM-002'), name: 'Jabón de Barra x3', salePrice: 1.50, costPrice: 1.00, stock: 80, categoryIndex: 5 },
    { code: makeProductCode('LIM-003'), name: 'Cloro 1L', salePrice: 1.80, costPrice: 1.20, stock: 55, categoryIndex: 5 },
    // Panadería (category 6)
    { code: makeProductCode('PAN-001'), name: 'Pan de Leche', salePrice: 0.25, costPrice: 0.15, stock: 500, categoryIndex: 6 },
    { code: makeProductCode('PAN-002'), name: 'Empanada de Queso', salePrice: 0.80, costPrice: 0.50, stock: 100, categoryIndex: 6 },
    { code: makeProductCode('PAN-003'), name: 'Pastel de Chocolate', salePrice: 3.00, costPrice: 2.00, stock: 10, categoryIndex: 6 },
  ];

  for (const prodData of productsData) {
    const existing = await productRepo.findOne({ where: { code: prodData.code } });
    if (existing) {
      console.log(`Product "${prodData.name}" already exists, skipping.`);
    } else {
      const product = await productRepo.save(
        productRepo.create({
          id: randomUUID(),
          categoryId: savedCategories[prodData.categoryIndex].id,
          code: prodData.code,
          name: prodData.name,
          salePrice: prodData.salePrice,
          costPrice: prodData.costPrice,
          currentStock: prodData.stock,
          isActive: true,
        }),
      );
      console.log(`Product "${prodData.name}" created (stock: ${prodData.stock}).`);
    }
  }

  // 3. Seed additional Customers
  const customersData = [
    { firstName: 'Juan', lastName: 'Pérez', cedula: '1723456789', phone: '0991234567', email: 'juan@email.com' },
    { firstName: 'María', lastName: 'García', cedula: '1712345678', phone: '0997654321', email: 'maria@email.com' },
    { firstName: 'Carlos', lastName: 'López', cedula: '1701234567', phone: '0999876543', email: 'carlos@email.com' },
  ];

  const existingCustomers = await customerRepo.find({ select: ['cedula', 'email'] });
  const usedCedulas = new Set(existingCustomers.map((customer) => customer.cedula).filter((value): value is string => Boolean(value)));
  const usedEmails = new Set(existingCustomers.map((customer) => customer.email).filter((value): value is string => Boolean(value)));

  for (const custData of customersData) {
    if (usedCedulas.has(custData.cedula) || usedEmails.has(custData.email)) {
      console.log(`Customer "${custData.firstName} ${custData.lastName}" already exists, skipping.`);
    } else {
      await customerRepo.save(
        customerRepo.create({ id: randomUUID(), ...custData, isActive: true }),
      );
      usedCedulas.add(custData.cedula);
      usedEmails.add(custData.email);
      console.log(`Customer "${custData.firstName} ${custData.lastName}" created.`);
    }
  }

  // 4. Seed Invoice Series (for fiscal invoice numbers)
  const adminBranchId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const existingSeries = await dataSource.getRepository(InvoiceSeriesTypeOrmEntity).findOne({
    where: { branchId: adminBranchId, isActive: true },
  });

  if (!existingSeries) {
    await dataSource.getRepository(InvoiceSeriesTypeOrmEntity).save(
      dataSource.getRepository(InvoiceSeriesTypeOrmEntity).create({
        id: randomUUID(),
        branchId: adminBranchId,
        establishmentCode: '001',
        emissionPointCode: '001',
        currentSequence: 0,
        isActive: true,
      }),
    );
    console.log('Invoice series created for admin branch: 001-001-000000000');
  } else {
    console.log('Invoice series already exists, skipping.');
  }

  console.log('\n=== POS Seed completed successfully! ===');
  console.log('Products created: 24 across 7 categories.');
  console.log('Customers created: CONSUMIDOR FINAL + 3 test customers.');
  console.log('\nTry these searches in GET /products?q=...');
  console.log('  ?q=Coca        -> finds Coca Cola');
  console.log('  ?q=BEB-        -> finds by code prefix');
  console.log('  ?q=Leche       -> finds milk products');
  console.log('  ?q=Papas       -> snacks');
  console.log('  ?q=001         -> finds by code number');

  await dataSource.destroy();
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
