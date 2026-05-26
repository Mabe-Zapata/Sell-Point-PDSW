import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { v5 as uuidv5 } from 'uuid';
import { dataSource } from '../../config/typeorm.config';
import { UserTypeOrmEntity } from './entities/user.typeorm.entity';
import { UserRoleTypeOrmEntity } from './entities/user-role.typeorm.entity';
import { RoleTypeOrmEntity } from './entities/role.typeorm.entity';

const ADMIN_EMPLOYEE_ID = 'ADMIN-001';
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@billflow.com';
const ADMIN_PASSWORD = 'Admin1234!';
const SALT_ROUNDS = 10;
const UUID_NAMESPACE = 'f8d1f8a7-8b36-4a6f-9e9a-7d8e7a7f6c01';

async function main() {
  await dataSource.initialize();
  const roleRepo = dataSource.getRepository(RoleTypeOrmEntity);

  const adminRole = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    throw new Error('ADMIN role not found. Run role seed before seed-users.');
  }

  await dataSource.transaction(async (manager) => {
    const txUserRepo = manager.getRepository(UserTypeOrmEntity);
    const txUserRoleRepo = manager.getRepository(UserRoleTypeOrmEntity);

    // Delete all existing users (portable across PostgreSQL/Oracle)
    await txUserRoleRepo.createQueryBuilder().delete().from(UserRoleTypeOrmEntity).execute();
    await txUserRepo.createQueryBuilder().delete().from(UserTypeOrmEntity).execute();
    process.stdout.write('Existing users deleted.\n');

    // Hash the password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    // Insert new admin
    const admin = txUserRepo.create({
      id: uuidv5(ADMIN_EMPLOYEE_ID, UUID_NAMESPACE),
      employeeId: ADMIN_EMPLOYEE_ID,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      isActive: true,
    });

    const savedAdmin = await txUserRepo.save(admin);

    await txUserRoleRepo.save(
      txUserRoleRepo.create({
        userId: savedAdmin.id,
        roleId: adminRole.id,
      }),
    );
  });

  process.stdout.write('\nAdmin user created successfully:\n');
  process.stdout.write(`  Employee ID : ${ADMIN_EMPLOYEE_ID}\n`);
  process.stdout.write(`  Username    : ${ADMIN_USERNAME}\n`);
  process.stdout.write(`  Email       : ${ADMIN_EMAIL}\n`);
  process.stdout.write(`  Password    : ${ADMIN_PASSWORD}\n`);
  process.stdout.write(`  Role        : ADMIN (via USER_ROLES)\n`);
  process.stdout.write('\nUse these credentials to log in.\n');
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  })
  .finally(() => dataSource.destroy());
