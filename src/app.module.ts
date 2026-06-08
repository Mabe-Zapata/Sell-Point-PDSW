 
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SwaggerModule } from '@nestjs/swagger';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration } from './config/configuration';
import { typeormConfig } from './config/typeorm.config';
import { createSwaggerConfig } from './config/swagger.config';
import { TypeOrmUnitOfWork } from './infrastructure/persistence/typeorm/unit-of-work/typeorm-unit-of-work';
import { UNIT_OF_WORK } from './infrastructure/common/injection-tokens';
import { RolesGuard } from './presentation/guards/roles.guard';
import { CorrelationInterceptor } from './presentation/interceptors/correlation.interceptor';

// Application - Validators only (from application/cqrs)
import {
  CreateCustomerValidator,
  UpdateCustomerValidator,
  ActivateCustomerValidator,
  DeactivateCustomerValidator,
  DeleteCustomerValidator,
  GetCustomerValidator,
  ListCustomersValidator,
  ListCustomersWithStockValidator,
  CreateProductValidator,
  UpdateProductValidator,
  DeleteProductValidator,
  GetProductValidator,
  ListProductsValidator,
  ListProductsWithStockValidator,
  CreateCategoryValidator,
  UpdateCategoryValidator,
  DeleteCategoryValidator,
  ActivateCategoryValidator,
  DeactivateCategoryValidator,
  GetCategoryValidator,
  ListCategoriesValidator,
  CreateTaxRateValidator,
  UpdateTaxRateValidator,
  GetTaxRateValidator,
  ListTaxRatesValidator,
  CreateSaleValidator,
  AddSaleDetailValidator,
  RemoveSaleDetailValidator,
  UpdateSaleDetailQuantityValidator,
  ConfirmSaleValidator,
  CancelSaleValidator,
  QuickConfirmSaleValidator,
  GetSaleValidator,
  ListSalesValidator,
  AdjustStockValidator,
  GetStockLevelsValidator,
  GetMovementsHistoryValidator,
  GetErrorLogValidator,
  ListErrorLogsValidator,
  UnlockUserValidator,
  CreateUserValidator,
  UpdateUserValidator,
  ActivateUserValidator,
  DeactivateUserValidator,
  GetUserValidator,
  ListUsersValidator,
  ListRolesValidator,
  GetRoleValidator,
  CreateRoleValidator,
  UpdateRoleValidator,
  RegisterEmployeeValidator,
  RequestPasswordResetValidator,
  ResetPasswordValidator,
} from './application/cqrs';

// Infrastructure - CQRS Wrappers (NestJS integration with decorators)
import {
  // Customer Commands
  CreateCustomerHandler,
  UpdateCustomerHandler,
  ActivateCustomerHandler,
  DeactivateCustomerHandler,
  DeleteCustomerHandler,
  // Customer Queries
  GetCustomerHandler,
  ListCustomersHandler,
  ListCustomersWithStockHandler,
  // Product Commands
  CreateProductHandler,
  UpdateProductHandler,
  ActivateProductHandler,
  DeactivateProductHandler,
  // Product Queries
  GetProductHandler,
  GetNextProductCodeHandler,
  ListProductsHandler,
  ListProductsWithStockHandler,
  // Category Commands
  CreateCategoryHandler,
  UpdateCategoryHandler,
  ActivateCategoryHandler,
  DeactivateCategoryHandler,
  // Category Queries
  GetCategoryHandler,
  ListCategoriesHandler,
  // TaxRate Commands
  CreateTaxRateHandler,
  UpdateTaxRateHandler,
  // TaxRate Queries
  GetTaxRateHandler,
  ListTaxRatesHandler,
  // User Commands
  CreateUserHandler,
  UpdateUserHandler,
  ActivateUserHandler,
  DeactivateUserHandler,
  UnlockUserHandler,
  // User Queries
  GetUserHandler,
  ListUsersHandler,
  // Role Commands
  CreateRoleHandler,
  UpdateRoleHandler,
  // Role Queries
  GetRoleHandler,
  ListRolesHandler,
  // Sale Commands
  CreateSaleHandler,
  AddSaleDetailHandler,
  RemoveSaleDetailHandler,
  UpdateSaleDetailQuantityHandler,
  ConfirmSaleHandler,
  CancelSaleHandler,
  QuickConfirmSaleHandler,
  // Sale Queries
  GetSaleHandler,
  ListSalesHandler,
  // Inventory Commands
  AdjustStockHandler,
  // Inventory Queries
  GetStockLevelsHandler,
  GetMovementsHistoryHandler,
  // ErrorLog Queries
  GetErrorLogHandler,
  ListErrorLogsHandler,
  // Dashboard Queries
  GetDashboardStatsHandler,
  // Invoice Commands
  CreateInvoiceHandler,
  CancelInvoiceHandler,
  // Invoice Queries
  GetInvoiceHandler,
  ListInvoicesHandler,
  // Auth Handlers
  RegisterEmployeeHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
} from './infrastructure/cqrs';

// Application - DI Tokens
import { TAX_CALCULATOR } from './infrastructure/common/injection-tokens';
import {
  PRODUCT_QUERY_SERVICE, CUSTOMER_QUERY_SERVICE, INVOICE_QUERY_SERVICE,
  DASHBOARD_QUERY_SERVICE, SALE_QUERY_SERVICE,
  ERROR_LOG_QUERY_SERVICE
} from './application/query-tokens';
import { PDF_SERVICE } from './application/services/pdf-service.interface';

// Domain + Infrastructure (barrel imports)
import { TaxCalculator } from './domain/services';
import {
  CustomerRepository, ProductRepository, InvoiceRepository, InvoiceItemRepository,
  DashboardRepository, UserRepository, CategoryRepository,
  ErrorLogRepository, TaxRateRepository,
  StockMovementRepository, SaleRepository, SaleDetailRepository,
  InvoiceSeriesRepository, RoleRepository, PasswordResetTokenRepository,
  InvoiceAuditLogRepository,
} from './infrastructure/repositories';
import {
  DashboardQueryService, InvoiceQueryService, CustomerQueryService,
  ProductQueryService, SaleQueryService,
  ErrorLogQueryService,
} from './infrastructure/queries';
import { PdfService, AuthService, CookieService } from './infrastructure/services';
import { IdempotencyService } from './infrastructure/services/idempotency.service';
import { RedisModule } from './infrastructure/redis/redis.module';
import { EmailModule } from './infrastructure/email/email.module';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import {
  CategoryTypeOrmEntity, CustomerTypeOrmEntity,
  ErrorLogTypeOrmEntity, InvoiceTypeOrmEntity,
  InvoiceSeriesTypeOrmEntity, InvoiceItemTypeOrmEntity,
  InvoiceAuditLogTypeOrmEntity,
  ProductTypeOrmEntity, RoleTypeOrmEntity, SaleTypeOrmEntity,
  SaleDetailTypeOrmEntity, StockMovementTypeOrmEntity,
  TaxRateTypeOrmEntity, UserTypeOrmEntity, UserBranchTypeOrmEntity,
  UserRoleTypeOrmEntity, PasswordResetTokenTypeOrmEntity,
  IdempotencyEntryTypeOrmEntity,
} from './infrastructure/database/entities';

// Presentation
import {
  CustomerController, ProductController, InvoiceController, DashboardController,
  AuthController, CategoryController, UserController, RoleController,
  ErrorLogController, SaleController, TaxRateController, InvoiceSeriesController,
} from './presentation/controllers';
import { GlobalExceptionFilter, PaginationInterceptor } from './presentation';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
// Infrastructure - Event Listeners
import {
  EmployeeCredentialsCreatedListener,
  PasswordResetRequestedListener,
  PasswordChangedListener,
  InvoiceEmailListener,
  OrderConfirmedListener,
  SaleConfirmedInvoiceListener,
  SaleCancelledInvoiceListener,
} from './infrastructure/listeners';

// All TypeORM entities
const entities = [
  CategoryTypeOrmEntity, CustomerTypeOrmEntity,
  ErrorLogTypeOrmEntity, IdempotencyEntryTypeOrmEntity,
  InvoiceTypeOrmEntity, InvoiceSeriesTypeOrmEntity,
  InvoiceItemTypeOrmEntity, InvoiceAuditLogTypeOrmEntity,
  ProductTypeOrmEntity, RoleTypeOrmEntity, SaleTypeOrmEntity,
  SaleDetailTypeOrmEntity, StockMovementTypeOrmEntity,
  TaxRateTypeOrmEntity, UserTypeOrmEntity, UserBranchTypeOrmEntity,
  UserRoleTypeOrmEntity, PasswordResetTokenTypeOrmEntity,
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
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: 60000,
        limit: 5,
      },
    ]),
    RedisModule,
    CqrsModule,
    EmailModule,
    FirebaseModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (): TypeOrmModuleOptions => ({
        ...typeormConfig,
        entities,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [
    AppController, CustomerController, ProductController, InvoiceController,
    DashboardController, AuthController, CategoryController, UserController,
    RoleController,   ErrorLogController, SaleController, TaxRateController,
    InvoiceSeriesController,
  ],
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
    { provide: 'PASSWORD_RESET_TOKEN_REPOSITORY', useClass: PasswordResetTokenRepository },
    { provide: 'INVOICE_AUDIT_LOG_REPOSITORY', useClass: InvoiceAuditLogRepository },
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
    CookieService,
    // Unit of Work
    { provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
    TypeOrmUnitOfWork,
    // Idempotency Service
    IdempotencyService,
    // Application - Listeners (from EmailModule — do not duplicate here)
    InvoiceEmailListener,
    OrderConfirmedListener,
    SaleConfirmedInvoiceListener,
    SaleCancelledInvoiceListener,

    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },

    // CQRS Handlers (from infrastructure/cqrs - NestJS wrappers)
    CreateCustomerHandler,
    UpdateCustomerHandler,
    ActivateCustomerHandler,
    DeactivateCustomerHandler,
    DeleteCustomerHandler,
    GetCustomerHandler,
    ListCustomersHandler,
    ListCustomersWithStockHandler,
    CreateProductHandler,
    UpdateProductHandler,
    ActivateProductHandler,
    DeactivateProductHandler,
    GetProductHandler,
    GetNextProductCodeHandler,
    ListProductsHandler,
    ListProductsWithStockHandler,
    CreateCategoryHandler,
    UpdateCategoryHandler,
    ActivateCategoryHandler,
    DeactivateCategoryHandler,
    GetCategoryHandler,
    ListCategoriesHandler,
    CreateTaxRateHandler,
    UpdateTaxRateHandler,
    GetTaxRateHandler,
    ListTaxRatesHandler,
    CreateSaleHandler,
    AddSaleDetailHandler,
    RemoveSaleDetailHandler,
    UpdateSaleDetailQuantityHandler,
    ConfirmSaleHandler,
    CancelSaleHandler,
    QuickConfirmSaleHandler,
    GetSaleHandler,
    ListSalesHandler,
    AdjustStockHandler,
    GetStockLevelsHandler,
    GetMovementsHistoryHandler,
    GetErrorLogHandler,
    ListErrorLogsHandler,
    GetDashboardStatsHandler,
    // Invoice Commands
    CreateInvoiceHandler,
    CancelInvoiceHandler,
    // Invoice Queries
    GetInvoiceHandler,
    ListInvoicesHandler,
    CreateUserHandler,
    UpdateUserHandler,
    ActivateUserHandler,
    DeactivateUserHandler,
    UnlockUserHandler,
    GetUserHandler,
    ListUsersHandler,
    CreateRoleHandler,
    UpdateRoleHandler,
    GetRoleHandler,
    ListRolesHandler,
    RegisterEmployeeHandler,
    RequestPasswordResetHandler,
    ResetPasswordHandler,

    // CQRS Validators (from application/cqrs - pure TypeScript)
    CreateCustomerValidator,
    UpdateCustomerValidator,
    ActivateCustomerValidator,
    DeactivateCustomerValidator,
    DeleteCustomerValidator,
    GetCustomerValidator,
    ListCustomersValidator,
    ListCustomersWithStockValidator,
    CreateProductValidator,
    UpdateProductValidator,
    DeleteProductValidator,
    GetProductValidator,
    ListProductsValidator,
    ListProductsWithStockValidator,
    CreateCategoryValidator,
    UpdateCategoryValidator,
    DeleteCategoryValidator,
    ActivateCategoryValidator,
    DeactivateCategoryValidator,
    GetCategoryValidator,
    ListCategoriesValidator,
    CreateTaxRateValidator,
    UpdateTaxRateValidator,
    GetTaxRateValidator,
    ListTaxRatesValidator,
    CreateSaleValidator,
    AddSaleDetailValidator,
    RemoveSaleDetailValidator,
    UpdateSaleDetailQuantityValidator,
    ConfirmSaleValidator,
    CancelSaleValidator,
    QuickConfirmSaleValidator,
    GetSaleValidator,
    ListSalesValidator,
    AdjustStockValidator,
    GetStockLevelsValidator,
    GetMovementsHistoryValidator,
    GetErrorLogValidator,
    ListErrorLogsValidator,
    CreateUserValidator,
    UpdateUserValidator,
    ActivateUserValidator,
    DeactivateUserValidator,
    UnlockUserValidator,
    GetUserValidator,
    ListUsersValidator,
    CreateRoleValidator,
    UpdateRoleValidator,
    GetRoleValidator,
    ListRolesValidator,
    RegisterEmployeeValidator,
    RequestPasswordResetValidator,
    ResetPasswordValidator,
  ],
})
export class AppModule {
  // eslint-disable-next-line @typescript-eslint/require-await
  static async setupSwagger(app: any): Promise<void> {
    const config = createSwaggerConfig();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }
}
