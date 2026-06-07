import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { typeormConfig } from './config/typeorm.config';
import { buildCorsOptions } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  const configService = app.get(ConfigService);

  // ─────────────────────────────────────────────────────────────────────────────
  // WARN: synchronize enabled check
  // ─────────────────────────────────────────────────────────────────────────────
  if (typeormConfig.synchronize === true) {
    console.warn(
      '\x1b[33m[WARNING]\x1b[0m TypeORM synchronize is ENABLED. ' +
        'This is dangerous in production and will overwrite the schema. ' +
        'Set synchronize: false in src/config/typeorm.config.ts and run migrations with: ' +
        'npm run typeorm:migration:run',
    );
  }

  // Enable CORS only for explicitly allowed origins
  app.enableCors(buildCorsOptions(configService));

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  await AppModule.setupSwagger(app);

  const port = configService.get<number>('app.port') || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
