import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration } from './config/configuration';
import { typeormConfig } from './config/typeorm.config';

// Domain
import { TaxCalculator } from './domain/services/tax-calculator.service';

// Application - CQRS (Customer)
import { CreateCustomerHandler } from './application/cqrs/customer/commands/create-customer/create-customer.handler';
import { CreateCustomerValidator } from './application/cqrs/customer/commands/create-customer/create-customer.validator';
import { UpdateCustomerHandler } from './application/cqrs/customer/commands/update-customer/update-customer.handler';
import { UpdateCustomerValidator } from './application/cqrs/customer/commands/update-customer/update-customer.validator';
import { DeleteCustomerHandler } from './application/cqrs/customer/commands/delete-customer/delete-customer.handler';
import { DeleteCustomerValidator } from './application/cqrs/customer/commands/delete-customer/delete-customer.validator';
import { GetCustomerHandler } from './application/cqrs/customer/queries/get-customer/get-customer.handler';
import { GetCustomerValidator } from './application/cqrs/customer/queries/get-customer/get-customer.validator';
import { ListCustomersHandler } from './application/cqrs/customer/queries/list-customers/list-customers.handler';
import { ListCustomersValidator } from './application/cqrs/customer/queries/list-customers/list-customers.validator';

// Application - CQRS (Product)
import { CreateProductHandler } from './application/cqrs/product/commands/create-product/create-product.handler';
import { CreateProductValidator } from './application/cqrs/product/commands/create-product/create-product.validator';
import { UpdateProductHandler } from './application/cqrs/product/commands/update-product/update-product.handler';
import { UpdateProductValidator } from './application/cqrs/product/commands/update-product/update-product.validator';
import { DeleteProductHandler } from './application/cqrs/product/commands/delete-product/delete-product.handler';
import { DeleteProductValidator } from './application/cqrs/product/commands/delete-product/delete-product.validator';
import { GetProductHandler } from './application/cqrs/product/queries/get-product/get-product.handler';
import { GetProductValidator } from './application/cqrs/product/queries/get-product/get-product.validator';
import { ListProductsHandler } from './application/cqrs/product/queries/list-products/list-products.handler';
import { ListProductsValidator } from './application/cqrs/product/queries/list-products/list-products.validator';

// Application - CQRS (Invoice)
import { CreateInvoiceHandler } from './application/cqrs/invoice/commands/create-invoice/create-invoice.handler';
import { CreateInvoiceValidator } from './application/cqrs/invoice/commands/create-invoice/create-invoice.validator';
import { GetInvoiceHandler } from './application/cqrs/invoice/queries/get-invoice/get-invoice.handler';
import { GetInvoiceValidator } from './application/cqrs/invoice/queries/get-invoice/get-invoice.validator';
import { ListInvoicesHandler } from './application/cqrs/invoice/queries/list-invoices/list-invoices.handler';
import { ListInvoicesValidator } from './application/cqrs/invoice/queries/list-invoices/list-invoices.validator';
import { GenerateInvoicePdfHandler } from './application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.handler';
import { GenerateInvoicePdfValidator } from './application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.validator';

// Infrastructure - Repositories
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { InvoiceRepository } from './infrastructure/repositories/invoice.repository';
import { InvoiceItemRepository } from './infrastructure/repositories/invoice-item.repository';
import { DashboardRepository } from './infrastructure/repositories/dashboard.repository';

// Infrastructure - Services
import { PdfService } from './infrastructure/services/pdf.service';
import { AuthService } from './infrastructure/services/auth.service';
import { RedisModule } from './infrastructure/redis/redis.module';

// Infrastructure - Repositories (Auth)
import { UserRepository } from './infrastructure/repositories/user.repository';

// Application - Use Cases
import { GetDashboardStatsUseCase } from './application/use-cases/dashboard/get-dashboard-stats.use-case';

// Presentation - Controllers
import { CustomerController } from './presentation/controllers/customer.controller';
import { ProductController } from './presentation/controllers/product.controller';
import { InvoiceController } from './presentation/controllers/invoice.controller';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { AuthController } from './presentation/controllers/auth.controller';

// Presentation - Filters and Interceptors
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { PaginationInterceptor } from './presentation/interceptors/pagination.interceptor';

// TypeORM Entities
import { CustomerTypeOrmEntity } from './infrastructure/database/entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from './infrastructure/database/entities/product.typeorm.entity';
import { InvoiceTypeOrmEntity } from './infrastructure/database/entities/invoice.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from './infrastructure/database/entities/invoice-item.typeorm.entity';
import { UserTypeOrmEntity } from './infrastructure/database/entities/user.typeorm.entity';

// CQRS Handlers and Validators
const CommandHandlers = [
  CreateCustomerHandler,
  CreateCustomerValidator,
  UpdateCustomerHandler,
  UpdateCustomerValidator,
  DeleteCustomerHandler,
  DeleteCustomerValidator,
  CreateProductHandler,
  CreateProductValidator,
  UpdateProductHandler,
  UpdateProductValidator,
  DeleteProductHandler,
  DeleteProductValidator,
  CreateInvoiceHandler,
  CreateInvoiceValidator,
];

const QueryHandlers = [
  GetCustomerHandler,
  GetCustomerValidator,
  ListCustomersHandler,
  ListCustomersValidator,
  GetProductHandler,
  GetProductValidator,
  ListProductsHandler,
  ListProductsValidator,
  GetInvoiceHandler,
  GetInvoiceValidator,
  ListInvoicesHandler,
  ListInvoicesValidator,
  GenerateInvoicePdfHandler,
  GenerateInvoicePdfValidator,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
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
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [
          CustomerTypeOrmEntity,
          ProductTypeOrmEntity,
          InvoiceTypeOrmEntity,
          InvoiceItemTypeOrmEntity,
          UserTypeOrmEntity,
        ],
        synchronize: typeormConfig.synchronize,
        logging: typeormConfig.logging,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      CustomerTypeOrmEntity,
      ProductTypeOrmEntity,
      InvoiceTypeOrmEntity,
      InvoiceItemTypeOrmEntity,
      UserTypeOrmEntity,
    ]),
  ],
  controllers: [
    AppController,
    CustomerController,
    ProductController,
    InvoiceController,
    DashboardController,
    AuthController,
  ],
  providers: [
    AppService,
    // Domain Services
    {
      provide: TaxCalculator,
      useFactory: (configService: ConfigService) => {
        const taxPercentage = configService.get<number>('tax.percentage');
        if (taxPercentage === undefined) {
          throw new Error('tax.percentage is not defined in configuration');
        }
        return new TaxCalculator(taxPercentage);
      },
      inject: [ConfigService],
    },
    // Infrastructure - Repositories
    CustomerRepository,
    ProductRepository,
    InvoiceRepository,
    InvoiceItemRepository,
    DashboardRepository,
    UserRepository,
    // Infrastructure - Services (Auth)
    AuthService,
    // Infrastructure - Services
    PdfService,
    // Application - Use Cases
    GetDashboardStatsUseCase,
    // DataSource for transactions
    // Global Filters and Interceptors
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PaginationInterceptor,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AppModule {
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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
}
