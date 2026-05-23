/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration } from './config/configuration';
import { typeormConfig } from './config/typeorm.config';

// Application - DI Tokens + CQRS Handlers (reducers)
import { TAX_CALCULATOR } from './application/tokens';
import {
  PRODUCT_QUERY_SERVICE, CUSTOMER_QUERY_SERVICE, INVOICE_QUERY_SERVICE,
  DASHBOARD_QUERY_SERVICE, SALE_QUERY_SERVICE, INVENTORY_QUERY_SERVICE,
  ERROR_LOG_QUERY_SERVICE
} from './application/query-tokens';
import { PDF_SERVICE } from './application/services/pdf-service.interface';
import {
  CreateCustomerHandler, CreateCustomerValidator,
  UpdateCustomerHandler, UpdateCustomerValidator,
  DeleteCustomerHandler, DeleteCustomerValidator,
  GetCustomerHandler, GetCustomerValidator,
  ListCustomersHandler, ListCustomersValidator,
  ListCustomersWithStockHandler, ListCustomersWithStockValidator,
  CreateProductHandler, CreateProductValidator,
  UpdateProductHandler, UpdateProductValidator,
  DeleteProductHandler, DeleteProductValidator,
  GetProductHandler, GetProductValidator,
  ListProductsHandler, ListProductsValidator,
  ListProductsWithStockHandler, ListProductsWithStockValidator,
  CreateCategoryHandler, CreateCategoryValidator,
  UpdateCategoryHandler, UpdateCategoryValidator,
  GetCategoryHandler, GetCategoryValidator,
  ListCategoriesHandler, ListCategoriesValidator,
  CreateTaxRateHandler, CreateTaxRateValidator,
  UpdateTaxRateHandler, UpdateTaxRateValidator,
  GetTaxRateHandler, GetTaxRateValidator,
  ListTaxRatesHandler, ListTaxRatesValidator,
  CreateSaleHandler, CreateSaleValidator,
  AddSaleDetailHandler, AddSaleDetailValidator,
  RemoveSaleDetailHandler, RemoveSaleDetailValidator,
  UpdateSaleDetailQuantityHandler, UpdateSaleDetailQuantityValidator,
  ConfirmSaleHandler, ConfirmSaleValidator,
  CancelSaleHandler, CancelSaleValidator,
  GetSaleHandler, GetSaleValidator,
  ListSalesHandler, ListSalesValidator,
  GetStockLevelsHandler, GetStockLevelsValidator,
  GetMovementsHistoryHandler, GetMovementsHistoryValidator,
  GetErrorLogHandler, GetErrorLogValidator,
  ListErrorLogsHandler, ListErrorLogsValidator,
  GetDashboardStatsHandler,
} from './application/cqrs';

// Domain + Infrastructure (barrel imports)
import { TaxCalculator } from './domain/services';
import {
  CustomerRepository, ProductRepository, InvoiceRepository, InvoiceItemRepository,
  DashboardRepository, UserRepository, CategoryRepository,
  ErrorLogRepository, TaxRateRepository,
  StockMovementRepository, SaleRepository, SaleDetailRepository,
  InvoiceSeriesRepository,
} from './infrastructure/repositories';
import {
  DashboardQueryService, InvoiceQueryService, CustomerQueryService,
  ProductQueryService, SaleQueryService,
  ErrorLogQueryService,
} from './infrastructure/queries';
import { PdfService, AuthService } from './infrastructure/services';
import { RedisModule } from './infrastructure/redis/redis.module';
import {
  CategoryTypeOrmEntity, CustomerTypeOrmEntity,
  ErrorLogTypeOrmEntity, InvoiceTypeOrmEntity,
  InvoiceSeriesTypeOrmEntity, InvoiceItemTypeOrmEntity,
  ProductTypeOrmEntity, RoleTypeOrmEntity, SaleTypeOrmEntity,
  SaleDetailTypeOrmEntity, StockMovementTypeOrmEntity,
  TaxRateTypeOrmEntity, UserTypeOrmEntity, UserBranchTypeOrmEntity,
  UserRoleTypeOrmEntity,
} from './infrastructure/database/entities';

// Presentation
import { CustomerController, ProductController, InvoiceController, DashboardController, AuthController } from './presentation/controllers';
import { GlobalExceptionFilter, PaginationInterceptor } from './presentation';

// CQRS arrays
const CommandHandlers = [
  CreateCustomerHandler, CreateCustomerValidator,
  UpdateCustomerHandler, UpdateCustomerValidator,
  DeleteCustomerHandler, DeleteCustomerValidator,
  CreateProductHandler, CreateProductValidator,
  UpdateProductHandler, UpdateProductValidator,
  DeleteProductHandler, DeleteProductValidator,
  CreateCategoryHandler, CreateCategoryValidator,
  UpdateCategoryHandler, UpdateCategoryValidator,
  CreateTaxRateHandler, CreateTaxRateValidator,
  UpdateTaxRateHandler, UpdateTaxRateValidator,
  CreateSaleHandler, CreateSaleValidator,
  AddSaleDetailHandler, AddSaleDetailValidator,
  RemoveSaleDetailHandler, RemoveSaleDetailValidator,
  UpdateSaleDetailQuantityHandler, UpdateSaleDetailQuantityValidator,
  ConfirmSaleHandler, ConfirmSaleValidator,
  CancelSaleHandler, CancelSaleValidator,
];

const QueryHandlers = [
  GetCustomerHandler, GetCustomerValidator,
  ListCustomersHandler, ListCustomersValidator,
  ListCustomersWithStockHandler, ListCustomersWithStockValidator,
  GetProductHandler, GetProductValidator,
  ListProductsHandler, ListProductsValidator,
  ListProductsWithStockHandler, ListProductsWithStockValidator,
  GetCategoryHandler, GetCategoryValidator,
  ListCategoriesHandler, ListCategoriesValidator,
  GetTaxRateHandler, GetTaxRateValidator,
  ListTaxRatesHandler, ListTaxRatesValidator,
  GetSaleHandler, GetSaleValidator,
  ListSalesHandler, ListSalesValidator,
  GetStockLevelsHandler, GetStockLevelsValidator,
  GetMovementsHistoryHandler, GetMovementsHistoryValidator,
  GetErrorLogHandler, GetErrorLogValidator,
  ListErrorLogsHandler, ListErrorLogsValidator,
  GetDashboardStatsHandler,
];

// All TypeORM entities
const entities = [
  CategoryTypeOrmEntity, CustomerTypeOrmEntity,
  ErrorLogTypeOrmEntity, InvoiceTypeOrmEntity,
  InvoiceSeriesTypeOrmEntity, InvoiceItemTypeOrmEntity,
  ProductTypeOrmEntity, RoleTypeOrmEntity, SaleTypeOrmEntity,
  SaleDetailTypeOrmEntity, StockMovementTypeOrmEntity,
  TaxRateTypeOrmEntity, UserTypeOrmEntity, UserBranchTypeOrmEntity,
  UserRoleTypeOrmEntity,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: '.env' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: 900 },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    CqrsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities,
        synchronize: typeormConfig.synchronize,
        logging: typeormConfig.logging,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [AppController, CustomerController, ProductController, InvoiceController, DashboardController, AuthController],
  providers: [
    AppService,
    // Domain Services
    { provide: TAX_CALCULATOR, useFactory: (c: ConfigService) => new TaxCalculator(c.get<number>('tax.percentage')!), inject: [ConfigService] },
    // Infrastructure - Repositories (token-mapped)
    { provide: 'INVOICE_REPOSITORY', useClass: InvoiceRepository },
    { provide: 'INVOICE_ITEM_REPOSITORY', useClass: InvoiceItemRepository },
    { provide: 'CUSTOMER_REPOSITORY', useClass: CustomerRepository },
    { provide: 'PRODUCT_REPOSITORY', useClass: ProductRepository },
    { provide: 'DASHBOARD_REPOSITORY', useClass: DashboardRepository },
    { provide: 'USER_REPOSITORY', useClass: UserRepository },
    UserRepository, // AuthService needs direct injection
    { provide: 'CATEGORY_REPOSITORY', useClass: CategoryRepository },
    { provide: 'ERROR_LOG_REPOSITORY', useClass: ErrorLogRepository },
    { provide: 'TAX_RATE_REPOSITORY', useClass: TaxRateRepository },
    { provide: 'STOCK_MOVEMENT_REPOSITORY', useClass: StockMovementRepository },
    { provide: 'SALE_REPOSITORY', useClass: SaleRepository },
    { provide: 'SALE_DETAIL_REPOSITORY', useClass: SaleDetailRepository },
    { provide: 'INVOICE_SERIES_REPOSITORY', useClass: InvoiceSeriesRepository },
    // Infrastructure - pg Query Services (token-mapped)
    { provide: PRODUCT_QUERY_SERVICE, useClass: ProductQueryService },
    { provide: CUSTOMER_QUERY_SERVICE, useClass: CustomerQueryService },
    { provide: INVOICE_QUERY_SERVICE, useClass: InvoiceQueryService },
    { provide: DASHBOARD_QUERY_SERVICE, useClass: DashboardQueryService },
    { provide: SALE_QUERY_SERVICE, useClass: SaleQueryService },
    { provide: ERROR_LOG_QUERY_SERVICE, useClass: ErrorLogQueryService },
    // Infrastructure - Services
    { provide: PDF_SERVICE, useClass: PdfService },
    AuthService,

    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {
  // eslint-disable-next-line @typescript-eslint/require-await
  static async setupSwagger(app: any): Promise<void> {
    const config = new DocumentBuilder()
      .setTitle('Sell Point Backend API')
      .setDescription('Point of Sale Backend System - RESTful API')
      .setVersion('1.0')
      .addTag('customers', 'Customer management operations')
      .addTag('products', 'Product management operations')
      .addTag('invoices', 'Invoice and sales operations')
      .addTag('dashboard', 'Dashboard and statistics operations')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
}