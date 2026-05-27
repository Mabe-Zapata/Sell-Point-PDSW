import 'reflect-metadata';
import { dataSource } from '../../config/typeorm.config';
import { CategoryTypeOrmEntity } from './entities/category.typeorm.entity';
import { ProductTypeOrmEntity } from './entities/product.typeorm.entity';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';
import { InvoiceSeriesTypeOrmEntity } from './entities/invoice-series.typeorm.entity';
//import { v4 as uuidv4 } from 'uuid';

async function main() {
  await dataSource.initialize();
  console.log('Database connected for POS seed.');

  const categoryRepo = dataSource.getRepository(CategoryTypeOrmEntity);
  const productRepo = dataSource.getRepository(ProductTypeOrmEntity);
  const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);

  // 1. Seed Categories
  const categoriesData = [
    { name: 'Bebidas', description: 'Gaseosas, jugos y aguas' },
    { name: 'Snacks', description: 'Papas, galletas y chucherías' },
    { name: 'Lácteos', description: 'Leche, yogurt y quesos' },
    { name: 'Carnes', description: 'Res, pollo y cerdo' },
    { name: 'Granos Básicos', description: 'Arroz, azúcar, fideos' },
    { name: 'Limpieza', description: 'Detergentes, jabones y cloro' },
    { name: 'Panadería', description: 'Pan, pasteles y empanadas' },
  ];

  const savedCategories: CategoryTypeOrmEntity[] = [];

  for (const catData of categoriesData) {
    let category = await categoryRepo.findOne({ where: { name: catData.name } });
    if (category) {
      console.log(`Category "${catData.name}" already exists, skipping.`);
    } else {
      category = await categoryRepo.save(
        categoryRepo.create({ ...catData, isActive: true }),
      );
      console.log(`Category "${catData.name}" created.`);
    }
    savedCategories.push(category);
  }

  // 2. Seed Products
  const productsData = [
    // Bebidas (category 0)
    { code: 'BEB-001', name: 'Coca Cola 500ml', salePrice: 1.50, costPrice: 1.00, stock: 100, categoryIndex: 0 },
    { code: 'BEB-002', name: 'Sprite 500ml', salePrice: 1.50, costPrice: 1.00, stock: 80, categoryIndex: 0 },
    { code: 'BEB-003', name: 'Agua Sin Gas 600ml', salePrice: 1.00, costPrice: 0.60, stock: 120, categoryIndex: 0 },
    { code: 'BEB-004', name: 'Jugo Natural Naranja 1L', salePrice: 2.50, costPrice: 1.80, stock: 40, categoryIndex: 0 },
    { code: 'BEB-005', name: 'Cerveza Pilsener 355ml', salePrice: 2.00, costPrice: 1.20, stock: 60, categoryIndex: 0 },
    // Snacks (category 1)
    { code: 'SNK-001', name: 'Papas Lays Clásicas 40g', salePrice: 0.80, costPrice: 0.50, stock: 200, categoryIndex: 1 },
    { code: 'SNK-002', name: 'Galletas Oreo 120g', salePrice: 1.20, costPrice: 0.80, stock: 150, categoryIndex: 1 },
    { code: 'SNK-003', name: 'Chifles Verde 60g', salePrice: 1.00, costPrice: 0.60, stock: 90, categoryIndex: 1 },
    { code: 'SNK-004', name: 'Chocolate Nacional 50g', salePrice: 1.50, costPrice: 1.00, stock: 75, categoryIndex: 1 },
    // Lácteos (category 2)
    { code: 'LAC-001', name: 'Leche Entera 1L', salePrice: 1.20, costPrice: 0.90, stock: 100, categoryIndex: 2 },
    { code: 'LAC-002', name: 'Yogurt Natural 1L', salePrice: 2.00, costPrice: 1.40, stock: 50, categoryIndex: 2 },
    { code: 'LAC-003', name: 'Queso Fresco 500g', salePrice: 3.50, costPrice: 2.50, stock: 30, categoryIndex: 2 },
    // Carnes (category 3)
    { code: 'CAR-001', name: 'Pechuga de Pollo 1kg', salePrice: 4.50, costPrice: 3.20, stock: 40, categoryIndex: 3 },
    { code: 'CAR-002', name: 'Carne Molida 1kg', salePrice: 5.00, costPrice: 3.80, stock: 35, categoryIndex: 3 },
    // Granos Básicos (category 4)
    { code: 'GRA-001', name: 'Arroz Premium 1kg', salePrice: 1.10, costPrice: 0.80, stock: 200, categoryIndex: 4 },
    { code: 'GRA-002', name: 'Azúcar Blanca 1kg', salePrice: 1.00, costPrice: 0.70, stock: 180, categoryIndex: 4 },
    { code: 'GRA-003', name: 'Fideos Tallarín 500g', salePrice: 0.90, costPrice: 0.60, stock: 160, categoryIndex: 4 },
    { code: 'GRA-004', name: 'Aceite Vegetal 1L', salePrice: 2.80, costPrice: 2.00, stock: 60, categoryIndex: 4 },
    // Limpieza (category 5)
    { code: 'LIM-001', name: 'Detergente Líquido 750ml', salePrice: 3.00, costPrice: 2.10, stock: 45, categoryIndex: 5 },
    { code: 'LIM-002', name: 'Jabón de Barra x3', salePrice: 1.50, costPrice: 1.00, stock: 80, categoryIndex: 5 },
    { code: 'LIM-003', name: 'Cloro 1L', salePrice: 1.80, costPrice: 1.20, stock: 55, categoryIndex: 5 },
    // Panadería (category 6)
    { code: 'PAN-001', name: 'Pan de Leche', salePrice: 0.25, costPrice: 0.15, stock: 500, categoryIndex: 6 },
    { code: 'PAN-002', name: 'Empanada de Queso', salePrice: 0.80, costPrice: 0.50, stock: 100, categoryIndex: 6 },
    { code: 'PAN-003', name: 'Pastel de Chocolate', salePrice: 3.00, costPrice: 2.00, stock: 10, categoryIndex: 6 },
  ];

  for (const prodData of productsData) {
    const existing = await productRepo.findOne({ where: { code: prodData.code } });
    if (existing) {
      console.log(`Product "${prodData.name}" already exists, skipping.`);
    } else {
      await productRepo.save(
        productRepo.create({
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

  for (const custData of customersData) {
    const existing = await customerRepo.findOne({ where: { cedula: custData.cedula } });
    if (existing) {
      console.log(`Customer "${custData.firstName} ${custData.lastName}" already exists, skipping.`);
    } else {
      await customerRepo.save(
        customerRepo.create({ ...custData, isActive: true }),
      );
      console.log(`Customer "${custData.firstName} ${custData.lastName}" created.`);
    }
  }

  // 4. Seed Invoice Series (for sequential sale numbers)
  const adminBranchId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const existingSeries = await dataSource.getRepository(InvoiceSeriesTypeOrmEntity).findOne({
    where: { branchId: adminBranchId, isActive: true },
  });

  if (!existingSeries) {
    await dataSource.getRepository(InvoiceSeriesTypeOrmEntity).save(
      dataSource.getRepository(InvoiceSeriesTypeOrmEntity).create({
        branchId: adminBranchId,
        establishmentCode: '001',
        emissionPointCode: '001',
        sequenceNumber: 0,
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
