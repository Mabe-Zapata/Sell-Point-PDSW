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
import {
  CUSTOMER_REPOSITORY, PRODUCT_REPOSITORY, INVOICE_REPOSITORY,
  INVOICE_ITEM_REPOSITORY, USER_REPOSITORY, DASHBOARD_REPOSITORY, TAX_CALCULATOR,
} from './application/tokens';
import {
  PRODUCT_QUERY_SERVICE, CUSTOMER_QUERY_SERVICE, INVOICE_QUERY_SERVICE,
  DASHBOARD_QUERY_SERVICE, SALE_QUERY_SERVICE, INVENTORY_QUERY_SERVICE,
  STOCK_TRANSFER_QUERY_SERVICE, ERROR_LOG_QUERY_SERVICE
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
  CreateInvoiceHandler, CreateInvoiceValidator,
  GetInvoiceHandler, GetInvoiceValidator,
  ListInvoicesHandler, ListInvoicesValidator,
  ListInvoicesWithStockHandler, ListInvoicesWithStockValidator,
  GenerateInvoicePdfHandler, GenerateInvoicePdfValidator,
  CreateBranchHandler, CreateBranchValidator,
  UpdateBranchHandler, UpdateBranchValidator,
  DeleteBranchHandler, DeleteBranchValidator,
  GetBranchHandler, GetBranchValidator,
  ListBranchesHandler, ListBranchesValidator,
  CreateWarehouseHandler, CreateWarehouseValidator,
  UpdateWarehouseHandler, UpdateWarehouseValidator,
  GetWarehouseHandler, GetWarehouseValidator,
  ListWarehousesHandler, ListWarehousesValidator,
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
  CreateTransferHandler, CreateTransferValidator,
  ApproveTransferHandler, ApproveTransferValidator,
  SendTransferHandler, SendTransferValidator,
  ReceiveTransferHandler, ReceiveTransferValidator,
  CancelTransferHandler, CancelTransferValidator,
  GetTransferHandler, GetTransferValidator,
  ListTransfersHandler, ListTransfersValidator,
  CreatePaymentHandler, CreatePaymentValidator,
  GetSalesHistoryHandler, GetSalesHistoryValidator,
  GetErrorLogHandler, GetErrorLogValidator,
  ListErrorLogsHandler, ListErrorLogsValidator,
  GetDashboardStatsHandler,
} from './application/cqrs';

// Domain + Infrastructure (barrel imports)
import { TaxCalculator } from './domain/services';
import {
  CustomerRepository, ProductRepository, InvoiceRepository, InvoiceItemRepository,
  DashboardRepository, UserRepository, BranchRepository, CategoryRepository,
  WarehouseRepository, ErrorLogRepository, TaxRateRepository, InventoryRepository,
  StockMovementRepository, StockTransferRepository, StockTransferDetailRepository,
  SaleRepository, SaleDetailRepository, SalesHistoryRepository, PaymentRepository,
  InvoiceSeriesRepository,
} from './infrastructure/repositories';
import {
  DashboardQueryService, InvoiceQueryService, CustomerQueryService,
  ProductQueryService, SaleQueryService, InventoryQueryService,
  StockTransferQueryService, ErrorLogQueryService,
} from './infrastructure/queries';
import { PdfService, AuthService } from './infrastructure/services';
import { RedisModule } from './infrastructure/redis/redis.module';
import {
  BranchTypeOrmEntity, CategoryTypeOrmEntity, CustomerTypeOrmEntity,
  ErrorLogTypeOrmEntity, InventoryTypeOrmEntity, InvoiceTypeOrmEntity,
  InvoiceSeriesTypeOrmEntity, InvoiceItemTypeOrmEntity, PaymentTypeOrmEntity,
  ProductTypeOrmEntity, RoleTypeOrmEntity, SaleTypeOrmEntity,
  SaleDetailTypeOrmEntity, SalesHistoryTypeOrmEntity, StockMovementTypeOrmEntity,
  StockTransferTypeOrmEntity, StockTransferDetailTypeOrmEntity,
  TaxRateTypeOrmEntity, UserTypeOrmEntity, UserBranchTypeOrmEntity,
  UserRoleTypeOrmEntity, WarehouseTypeOrmEntity,
} from './infrastructure/database/entities';

// Presentation
import { CustomerController, ProductController, InvoiceController, DashboardController, AuthController } from './presentation/controllers';
import { GlobalExceptionFilter, PaginationInterceptor } from './presentation';

// Use Cases
import { GetDashboardStatsUseCase } from './application/use-cases/dashboard/get-dashboard-stats.use-case';

// CQRS arrays
const CommandHandlers = [
  CreateCustomerHandler, CreateCustomerValidator,
  UpdateCustomerHandler, UpdateCustomerValidator,
  DeleteCustomerHandler, DeleteCustomerValidator,
  CreateProductHandler, CreateProductValidator,
  UpdateProductHandler, UpdateProductValidator,
  DeleteProductHandler, DeleteProductValidator,
  CreateInvoiceHandler, CreateInvoiceValidator,
  CreateBranchHandler, CreateBranchValidator,
  UpdateBranchHandler, UpdateBranchValidator,
  DeleteBranchHandler, DeleteBranchValidator,
  CreateWarehouseHandler, CreateWarehouseValidator,
  UpdateWarehouseHandler, UpdateWarehouseValidator,
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
  CreateTransferHandler, CreateTransferValidator,
  ApproveTransferHandler, ApproveTransferValidator,
  SendTransferHandler, SendTransferValidator,
  ReceiveTransferHandler, ReceiveTransferValidator,
  CancelTransferHandler, CancelTransferValidator,
  CreatePaymentHandler, CreatePaymentValidator,
];

const QueryHandlers = [
  GetCustomerHandler, GetCustomerValidator,
  ListCustomersHandler, ListCustomersValidator,
  ListCustomersWithStockHandler, ListCustomersWithStockValidator,
  GetProductHandler, GetProductValidator,
  ListProductsHandler, ListProductsValidator,
  ListProductsWithStockHandler, ListProductsWithStockValidator,
  GetInvoiceHandler, GetInvoiceValidator,
  ListInvoicesHandler, ListInvoicesValidator,
  ListInvoicesWithStockHandler, ListInvoicesWithStockValidator,
  GenerateInvoicePdfHandler, GenerateInvoicePdfValidator,
  GetBranchHandler, GetBranchValidator,
  ListBranchesHandler, ListBranchesValidator,
  GetWarehouseHandler, GetWarehouseValidator,
  ListWarehousesHandler, ListWarehousesValidator,
  GetCategoryHandler, GetCategoryValidator,
  ListCategoriesHandler, ListCategoriesValidator,
  GetTaxRateHandler, GetTaxRateValidator,
  ListTaxRatesHandler, ListTaxRatesValidator,
  GetSaleHandler, GetSaleValidator,
  ListSalesHandler, ListSalesValidator,
  GetStockLevelsHandler, GetStockLevelsValidator,
  GetMovementsHistoryHandler, GetMovementsHistoryValidator,
  GetTransferHandler, GetTransferValidator,
  ListTransfersHandler, ListTransfersValidator,
  GetSalesHistoryHandler, GetSalesHistoryValidator,
  GetErrorLogHandler, GetErrorLogValidator,
  ListErrorLogsHandler, ListErrorLogsValidator,
  GetDashboardStatsHandler,
];

// All TypeORM entities
const entities = [
  BranchTypeOrmEntity, CategoryTypeOrmEntity, CustomerTypeOrmEntity,
  ErrorLogTypeOrmEntity, InventoryTypeOrmEntity, InvoiceTypeOrmEntity,
  InvoiceSeriesTypeOrmEntity, InvoiceItemTypeOrmEntity, PaymentTypeOrmEntity,
  ProductTypeOrmEntity, RoleTypeOrmEntity, SaleTypeOrmEntity,
  SaleDetailTypeOrmEntity, SalesHistoryTypeOrmEntity, StockMovementTypeOrmEntity,
  StockTransferTypeOrmEntity, StockTransferDetailTypeOrmEntity,
  TaxRateTypeOrmEntity, UserTypeOrmEntity, UserBranchTypeOrmEntity,
  UserRoleTypeOrmEntity, WarehouseTypeOrmEntity,
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
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerRepository },
    { provide: PRODUCT_REPOSITORY, useClass: ProductRepository },
    { provide: INVOICE_REPOSITORY, useClass: InvoiceRepository },
    { provide: INVOICE_ITEM_REPOSITORY, useClass: InvoiceItemRepository },
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardRepository },
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: 'BRANCH_REPOSITORY', useClass: BranchRepository },
    { provide: 'CATEGORY_REPOSITORY', useClass: CategoryRepository },
    { provide: 'WAREHOUSE_REPOSITORY', useClass: WarehouseRepository },
    { provide: 'ERROR_LOG_REPOSITORY', useClass: ErrorLogRepository },
    { provide: 'TAX_RATE_REPOSITORY', useClass: TaxRateRepository },
    { provide: 'INVENTORY_REPOSITORY', useClass: InventoryRepository },
    { provide: 'STOCK_MOVEMENT_REPOSITORY', useClass: StockMovementRepository },
    { provide: 'STOCK_TRANSFER_REPOSITORY', useClass: StockTransferRepository },
    { provide: 'STOCK_TRANSFER_DETAIL_REPOSITORY', useClass: StockTransferDetailRepository },
    { provide: 'SALE_REPOSITORY', useClass: SaleRepository },
    { provide: 'SALE_DETAIL_REPOSITORY', useClass: SaleDetailRepository },
    { provide: 'SALES_HISTORY_REPOSITORY', useClass: SalesHistoryRepository },
    { provide: 'PAYMENT_REPOSITORY', useClass: PaymentRepository },
    { provide: 'INVOICE_SERIES_REPOSITORY', useClass: InvoiceSeriesRepository },
    // Infrastructure - pg Query Services (token-mapped)
    { provide: PRODUCT_QUERY_SERVICE, useClass: ProductQueryService },
    { provide: CUSTOMER_QUERY_SERVICE, useClass: CustomerQueryService },
    { provide: INVOICE_QUERY_SERVICE, useClass: InvoiceQueryService },
    { provide: DASHBOARD_QUERY_SERVICE, useClass: DashboardQueryService },
    { provide: SALE_QUERY_SERVICE, useClass: SaleQueryService },
    { provide: INVENTORY_QUERY_SERVICE, useClass: InventoryQueryService },
    { provide: STOCK_TRANSFER_QUERY_SERVICE, useClass: StockTransferQueryService },
    { provide: ERROR_LOG_QUERY_SERVICE, useClass: ErrorLogQueryService },
    // Infrastructure - Services
    { provide: PDF_SERVICE, useClass: PdfService },
    AuthService,
    GetDashboardStatsUseCase,
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