import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { v5 as uuidv5 } from 'uuid';
import { dataSource } from '../../config/typeorm.config';
import { UserTypeOrmEntity } from './entities/user.typeorm.entity';
import { UserRoleTypeOrmEntity } from './entities/user-role.typeorm.entity';
import { RoleTypeOrmEntity } from './entities/role.typeorm.entity';

const ADMIN_SEED_KEY = 'ADMIN-001';
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@billflow.com';
const ADMIN_PASSWORD = 'Admin1234!';
const SELLER_PASSWORD = 'Seller1234!';
const SALT_ROUNDS = 10;
const UUID_NAMESPACE = 'f8d1f8a7-8b36-4a6f-9e9a-7d8e7a7f6c01';
const TOTAL_SELLERS = 99;

const FIRST_NAMES = ['Carlos', 'María', 'Juan', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Laura', 'Diego', 'Gabriela'];
const LAST_NAMES = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEmployeeId(seed: string): string {
  return `EMP-${uuidv5(seed, UUID_NAMESPACE).replace(/-/g, '').slice(0, 16).toUpperCase()}`;
}

async function main() {
  await dataSource.initialize();

  const roleRepo = dataSource.getRepository(RoleTypeOrmEntity);
  

  const adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  if (!adminRole) throw new Error('ADMIN role not found. Run npm run db:seed first.');

  const sellerRole = await roleRepo.findOne({ where: { name: 'VENDEDOR' } });
  if (!sellerRole) throw new Error('VENDEDOR role not found. Run npm run db:seed first.');

  await dataSource.transaction(async (manager) => {
    const txUserRepo = manager.getRepository(UserTypeOrmEntity);
    const txUserRoleRepo = manager.getRepository(UserRoleTypeOrmEntity);

    await txUserRoleRepo.createQueryBuilder().delete().from(UserRoleTypeOrmEntity).execute();
    await txUserRepo.createQueryBuilder().delete().from(UserTypeOrmEntity).execute();
    process.stdout.write('Existing users deleted.\n');

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const sellerPasswordHash = await bcrypt.hash(SELLER_PASSWORD, SALT_ROUNDS);

    // Admin
    const adminEmployeeId = makeEmployeeId(ADMIN_SEED_KEY);
    const admin = txUserRepo.create({
      id: uuidv5(ADMIN_SEED_KEY, UUID_NAMESPACE),
      employeeId: adminEmployeeId,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      isActive: true,
    });
    const savedAdmin = await txUserRepo.save(admin);
    await txUserRoleRepo.save(txUserRoleRepo.create({ userId: savedAdmin.id, roleId: adminRole.id }));
    process.stdout.write('Admin created.\n');

    // 99 vendedores
    process.stdout.write(`Insertando ${TOTAL_SELLERS} vendedores...\n`);
    for (let i = 1; i <= TOTAL_SELLERS; i++) {
      const seedKey = `SELLER-${String(i).padStart(3, '0')}`;
      const employeeId = makeEmployeeId(seedKey);
      const seller = txUserRepo.create({
        id: uuidv5(seedKey, UUID_NAMESPACE),
        employeeId,
        username: `vendedor${i}`,
        email: `vendedor${i}@billflow.com`,
        passwordHash: sellerPasswordHash,
        firstName: randomItem(FIRST_NAMES),
        lastName: randomItem(LAST_NAMES),
        isActive: true,
      });
      const savedSeller = await txUserRepo.save(seller);
      await txUserRoleRepo.save(txUserRoleRepo.create({ userId: savedSeller.id, roleId: sellerRole.id }));
      process.stdout.write(`  Vendedor ${i}/${TOTAL_SELLERS}\r`);
    }
    process.stdout.write(`\n✓ ${TOTAL_SELLERS} vendedores creados.\n`);
  });

  process.stdout.write('\nUsuarios creados:\n');
  process.stdout.write(`  Admin     : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);
  process.stdout.write(`  Vendedores: vendedor1@billflow.com ... vendedor99@billflow.com / ${SELLER_PASSWORD}\n`);
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  })
  .finally(() => dataSource.destroy());
