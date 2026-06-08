const fs = require('fs');
const path = require('path');
const appModulePath = path.join(__dirname, 'src/app.module.ts');
let content = fs.readFileSync(appModulePath, 'utf8');

content = content.replace(/\/\/ Application - Use Cases[\s\S]*?\/\/ Infrastructure - Repositories/m, '// Infrastructure - Repositories');
content = content.replace(/\/\/ Customer Use Cases[\s\S]*?\/\/ Infrastructure - Repositories/m, '// Infrastructure - Repositories');

const cqrsImports = `// Application - CQRS (Customer)
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
`;

content = content.replace('// Infrastructure - Repositories', cqrsImports + '\n// Infrastructure - Repositories');

const cqrsProviders = `
    // CQRS Handlers and Validators
    CreateCustomerHandler, CreateCustomerValidator,
    UpdateCustomerHandler, UpdateCustomerValidator,
    DeleteCustomerHandler, DeleteCustomerValidator,
    GetCustomerHandler, GetCustomerValidator,
    ListCustomersHandler, ListCustomersValidator,
    
    CreateProductHandler, CreateProductValidator,
    UpdateProductHandler, UpdateProductValidator,
    DeleteProductHandler, DeleteProductValidator,
    GetProductHandler, GetProductValidator,
    ListProductsHandler, ListProductsValidator,
    
    CreateInvoiceHandler, CreateInvoiceValidator,
    GetInvoiceHandler, GetInvoiceValidator,
    ListInvoicesHandler, ListInvoicesValidator,
    GenerateInvoicePdfHandler, GenerateInvoicePdfValidator,
`;

content = content.replace('// Infrastructure - Repositories', cqrsProviders + '\n    // Infrastructure - Repositories');

fs.writeFileSync(appModulePath, content);
console.log('App Module updated.');
