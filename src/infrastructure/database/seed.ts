import 'reflect-metadata';
import { dataSource } from '../../config/typeorm.config';
import { RoleTypeOrmEntity } from './entities/role.typeorm.entity';
// import { BranchTypeOrmEntity } from './entities/branch.typeorm.entity';
// import { WarehouseTypeOrmEntity } from './entities/warehouse.typeorm.entity';
// Branches and Warehouses deleted — simplify-schema-uta SDD
import { TaxRateTypeOrmEntity } from './entities/tax-rate.typeorm.entity';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';

async function main() {
  await dataSource.initialize();
  console.log('Database connected for seeding.');

  const roleRepo = dataSource.getRepository(RoleTypeOrmEntity);
  // const branchRepo = dataSource.getRepository(BranchTypeOrmEntity);
  // const warehouseRepo = dataSource.getRepository(WarehouseTypeOrmEntity);
  const taxRateRepo = dataSource.getRepository(TaxRateTypeOrmEntity);
  const customerRepo = dataSource.getRepository(CustomerTypeOrmEntity);

  // 1. Seed Roles
  const roles = [
    { name: 'ADMIN', description: 'Administrador del sistema' },
    { name: 'VENDEDOR', description: 'Vendedor de productos' },
    { name: 'CAJERO', description: 'Cajero de punto de venta' },
    { name: 'BODEGA', description: 'Encargado de bodega' },
  ];

  for (const roleData of roles) {
    const existing = await roleRepo.findOne({ where: { name: roleData.name } });
    if (existing) {
      console.log(`Role ${roleData.name} already exists, skipping.`);
    } else {
      await roleRepo.save(roleRepo.create(roleData));
      console.log(`Role ${roleData.name} created.`);
    }
  }

  // 2. Seed Branches — DELETED (simplify-schema-uta SDD)
  // const branchData = [
  //   { name: 'Quito', city: 'Quito', address: 'Av. Amazonas N35-42', phone: '02-999-1234' },
  //   { name: 'Ambato', city: 'Ambato', address: 'Calle Bolivar y Mercado', phone: '03-999-5678' },
  //   { name: 'Cuenca', city: 'Cuenca', address: 'Av. España y Gran Colombia', phone: '07-999-9012' },
  // ];
  // const savedBranches: BranchTypeOrmEntity[] = [];
  // for (const b of branchData) {
  //   let branch = await branchRepo.findOne({ where: { name: b.name } });
  //   if (branch) {
  //     console.log(`Branch ${b.name} already exists, skipping.`);
  //     savedBranches.push(branch);
  //   } else {
  //     branch = await branchRepo.save(branchRepo.create({ ...b, isActive: true }));
  //     console.log(`Branch ${b.name} created.`);
  //     savedBranches.push(branch);
  //   }
  // }

  // 3. Seed Warehouses — DELETED (simplify-schema-uta SDD)
  // const warehouseData = [
  //   { name: 'Bodega Quito', isMain: true, isActive: true },
  //   { name: 'Bodega Ambato', isMain: true, isActive: true },
  //   { name: 'Bodega Cuenca', isMain: true, isActive: true },
  // ];
  // for (let i = 0; i < warehouseData.length; i++) {
  //   const w = warehouseData[i];
  //   const branch = savedBranches[i];
  //   const existing = await warehouseRepo.findOne({ where: { name: w.name, branchId: branch.id } });
  //   if (existing) {
  //     console.log(`Warehouse ${w.name} already exists, skipping.`);
  //   } else {
  //     await warehouseRepo.save(warehouseRepo.create({ ...w, branchId: branch.id }));
  //     console.log(`Warehouse ${w.name} created.`);
  //   }
  // }

  // 4. Seed TaxRates
  const taxRatesData = [
    { name: 'IVA 15%', percentage: 15.00, isActive: true },
    { name: 'IVA 0%', percentage: 0.00, isActive: true },
  ];

  for (const taxData of taxRatesData) {
    const existing = await taxRateRepo.findOne({ where: { name: taxData.name } });
    if (existing) {
      console.log(`TaxRate ${taxData.name} already exists, skipping.`);
    } else {
      await taxRateRepo.save(taxRateRepo.create(taxData));
      console.log(`TaxRate ${taxData.name} created.`);
    }
  }

  // 5. Seed Consumer Final customer
  const consumerFinalData = {
    firstName: 'CONSUMIDOR',
    lastName: 'FINAL',
    cedula: '9999999999999',
    isActive: true,
  };

  let consumerFinal = await customerRepo.findOne({ where: { cedula: consumerFinalData.cedula } });
  if (consumerFinal) {
    console.log('Consumer Final customer already exists, skipping.');
  } else {
    consumerFinal = await customerRepo.save(customerRepo.create(consumerFinalData));
    console.log('Consumer Final customer created.');
  }

  console.log('Seeding completed.');
  await dataSource.destroy();
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});