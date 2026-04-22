import * as dotenv from 'dotenv';
dotenv.config();

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { configuration } from './configuration';

const config = configuration();

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../infrastructure/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
};

export const dataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../infrastructure/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
