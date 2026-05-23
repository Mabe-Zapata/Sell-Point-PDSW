import * as dotenv from 'dotenv';
dotenv.config();

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { configuration } from './configuration';

const config = configuration();

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../infrastructure/database/migrations/*{.ts,.js}'],
  // IMPORTANT: Set synchronize to false. Run migrations explicitly with:
  //   npm run typeorm:migration:run   (or: npx typeorm migration:run -d src/config/typeorm.config.ts)
  // Using synchronize:true will cause TypeORM to auto-sync entity changes to the schema,
  // which can cause data loss in production and bypasses migration versioning.
  synchronize: false,
  logging: true,
};

export const dataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../infrastructure/database/migrations/*{.ts,.js}'],
  // IMPORTANT: Set synchronize to false. Run migrations explicitly with:
  //   npm run typeorm:migration:run   (or: npx typeorm migration:run -d src/config/typeorm.config.ts)
  // Using synchronize:true will cause TypeORM to auto-sync entity changes to the schema,
  // which can cause data loss in production and bypasses migration versioning.
  synchronize: false,
  logging: true,
});
