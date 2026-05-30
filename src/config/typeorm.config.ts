/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as dotenv from 'dotenv';
dotenv.config();

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { configuration } from './configuration';
import { TypeormQueryLogger } from './typeorm-query.logger';

const config = configuration();
const isOracle = config.database.type === 'oracle';
const dbLabel = `${config.database.type}:${config.database.host}:${config.database.port}/${config.database.name}`;

// Estructura limpia y aislada para Oracle evitando colisiones
const baseConfig: any = {
  type: config.database.type as 'postgres' | 'oracle' | 'mysql' | 'mariadb',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../infrastructure/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['query', 'error', 'warn'],
  logger: new TypeormQueryLogger(dbLabel),
  maxQueryExecutionTime: 1,
};

if (isOracle) {
  // Oracle: normalizamos valores y usamos fallback seguro a la configuración base.
  const oracleUser = String(process.env.ORACLE_APP_USER ?? config.database.username).trim();
  const oraclePassword = String(
    process.env.ORACLE_APP_PASSWORD || process.env.ORACLE_PASSWORD || config.database.password,
  ).trim();
  const oracleHost = String(process.env.ORACLE_HOST ?? config.database.host).trim();
  const oraclePort = String(process.env.ORACLE_PORT ?? config.database.port).trim();
  const oracleDatabase = String(process.env.ORACLE_DATABASE ?? config.database.name).trim();

  baseConfig.username = oracleUser.toUpperCase(); // SELL_POINT
  baseConfig.password = oraclePassword;
  baseConfig.connectString = `${oracleHost}:${oraclePort}/${oracleDatabase}`; // localhost:1521/ORCLPDB1
  baseConfig.extra = {
    connectString: baseConfig.connectString,
  };
} else {
  baseConfig.url = config.database.url;
  baseConfig.host = config.database.host;
  baseConfig.port = config.database.port;
  baseConfig.username = config.database.username;
  baseConfig.password = config.database.password;
  baseConfig.database = config.database.name;
}

export const typeormConfig: TypeOrmModuleOptions = { ...baseConfig };
export const dataSource = new DataSource({ ...baseConfig });
