/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SwaggerModule } from '@nestjs/swagger';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration } from './config/configuration';
import { typeormConfig } from './config/typeorm.config';
import { createSwaggerConfig } from './config/swagger.config';
import { TypeOrmUnitOfWork } from './infrastructure/persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { UNIT_OF_WORK } from './application/tokens';
import { ConfirmSaleUseCase } from './application/use-cases/sale/confirm-sale.use-case';
import { CancelSaleUseCase } from './application/use-cases/sale/cancel-sale.use-case';
import { RolesGuard } from './presentation/guards/roles.guard';

// Application - DI Tokens + CQRS Handlers (reducers)
import { TAX_CALCULATOR } from './application/tokens';
import {
  PRODUCT_QUERY_SERVICE, CUSTOMER_QUERY_SERVICE, INVOICE_QUERY_SERVICE,
  DASHBOARD_QUERY_SERVICE, SALE_QUERY_SERVICE,
  ERROR_LOG_QUERY_SERVICE
} from './application/query-tokens';
import { PDF_SERVICE } from './application/services/pdf-service.interface';
import {
  CreateCustomerHandler, CreateCustomerValidator,
  UpdateCustomerHandler, UpdateCustomerValidator,
  ActivateCustomerHandler, ActivateCustomerValidator,
  DeactivateCustomerHandler, DeactivateCustomerValidator,
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
  DeleteCategoryHandler, DeleteCategoryValidator,
  ActivateCategoryHandler, ActivateCategoryValidator,
  DeactivateCategoryHandler, DeactivateCategoryValidator,
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
  AdjustStockHandler, AdjustStockValidator,
  GetStockLevelsHandler, GetStockLevelsValidator,
  GetMovementsHistoryHandler, GetMovementsHistoryValidator,
  GetErrorLogHandler, GetErrorLogValidator,
  ListErrorLogsHandler, ListErrorLogsValidator,
  GetDashboardStatsHandler, UnlockUserHandler, UnlockUserValidator,
  CreateUserHandler, CreateUserValidator,
UpdateUserHandler, UpdateUserValidator,
ActivateUserHandler, ActivateUserValidator,
DeactivateUserHandler, DeactivateUserValidator,
GetUserHandler, GetUserValidator,
ListUsersHandler, ListUsersValidator,
ListRolesHandler, ListRolesValidator, GetRoleHandler, GetRoleValidator,
CreateRoleHandler, CreateRoleValidator,
UpdateRoleHandler, UpdateRoleValidator,
} from './application/cqrs';

// Domain + Infrastructure (barrel imports)
import { TaxCalculator } from './domain/services';
import {
  CustomerRepository, ProductRepository, InvoiceRepository, InvoiceItemRepository,
  DashboardRepository, UserRepository, CategoryRepository,
  ErrorLogRepository, TaxRateRepository,
  StockMovementRepository, SaleRepository, SaleDetailRepository,
  InvoiceSeriesRepository,RoleRepository,
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
import { CustomerController, ProductController, InvoiceController, DashboardController, AuthController, CategoryController, UserController, RoleController } from './presentation/controllers';
import { GlobalExceptionFilter, PaginationInterceptor } from './presentation';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';

// CQRS arrays
const CommandHandlers = [
  UnlockUserHandler, UnlockUserValidator,
  CreateCustomerHandler, CreateCustomerValidator,
  UpdateCustomerHandler, UpdateCustomerValidator,
  ActivateCustomerHandler, ActivateCustomerValidator,
  DeactivateCustomerHandler, DeactivateCustomerValidator,
  CreateProductHandler, CreateProductValidator,
  UpdateProductHandler, UpdateProductValidator,
  DeleteProductHandler, DeleteProductValidator,
  CreateCategoryHandler, CreateCategoryValidator,
  UpdateCategoryHandler, UpdateCategoryValidator,
  DeleteCategoryHandler, DeleteCategoryValidator,
  ActivateCategoryHandler, ActivateCategoryValidator,
  DeactivateCategoryHandler, DeactivateCategoryValidator,
  CreateTaxRateHandler, CreateTaxRateValidator,
  UpdateTaxRateHandler, UpdateTaxRateValidator,
  CreateSaleHandler, CreateSaleValidator,
  AddSaleDetailHandler, AddSaleDetailValidator,
  RemoveSaleDetailHandler, RemoveSaleDetailValidator,
  UpdateSaleDetailQuantityHandler, UpdateSaleDetailQuantityValidator,
  ConfirmSaleHandler, ConfirmSaleValidator,
  CancelSaleHandler, CancelSaleValidator,
  AdjustStockHandler, AdjustStockValidator,
  CreateUserHandler, CreateUserValidator,
UpdateUserHandler, UpdateUserValidator,
ActivateUserHandler, ActivateUserValidator,
DeactivateUserHandler, DeactivateUserValidator,
CreateRoleHandler, CreateRoleValidator,
UpdateRoleHandler, UpdateRoleValidator,
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
  GetUserHandler, GetUserValidator,
ListUsersHandler, ListUsersValidator,
ListRolesHandler, ListRolesValidator,
GetRoleHandler, GetRoleValidator,
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
      useFactory: (): TypeOrmModuleOptions => ({
        ...typeormConfig,
        entities,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [AppController, CustomerController, ProductController, InvoiceController, DashboardController, AuthController, CategoryController, UserController, RoleController],
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
    { provide: 'ROLE_REPOSITORY', useClass: RoleRepository },
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
    // Unit of Work
    { provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
    TypeOrmUnitOfWork,
    // Use Cases
    ConfirmSaleUseCase,
    CancelSaleUseCase,

    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {
  // eslint-disable-next-line @typescript-eslint/require-await
  static async setupSwagger(app: any): Promise<void> {
    const config = createSwaggerConfig();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
}
