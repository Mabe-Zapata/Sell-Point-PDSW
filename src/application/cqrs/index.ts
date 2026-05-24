// Customer Commands
export { CreateCustomerHandler } from './customer/commands/create-customer/create-customer.handler';
export { CreateCustomerValidator } from './customer/commands/create-customer/create-customer.validator';
export { UpdateCustomerHandler } from './customer/commands/update-customer/update-customer.handler';
export { UpdateCustomerValidator } from './customer/commands/update-customer/update-customer.validator';
export { ActivateCustomerHandler } from './customer/commands/activate-customer/activate-customer.handler';
export { ActivateCustomerValidator } from './customer/commands/activate-customer/activate-customer.validator';
export { DeactivateCustomerHandler } from './customer/commands/deactivate-customer/deactivate-customer.handler';
export { DeactivateCustomerValidator } from './customer/commands/deactivate-customer/deactivate-customer.validator';
// Customer Queries
export { GetCustomerHandler } from './customer/queries/get-customer/get-customer.handler';
export { GetCustomerValidator } from './customer/queries/get-customer/get-customer.validator';
export { ListCustomersHandler } from './customer/queries/list-customers/list-customers.handler';
export { ListCustomersValidator } from './customer/queries/list-customers/list-customers.validator';
export { ListCustomersWithStockHandler } from './customer/queries/list-customers-with-stock/list-customers-with-stock.handler';
export { ListCustomersWithStockValidator } from './customer/queries/list-customers-with-stock/list-customers-with-stock.validator';

// Product Commands
export { CreateProductHandler } from './product/commands/create-product/create-product.handler';
export { CreateProductValidator } from './product/commands/create-product/create-product.validator';
export { UpdateProductHandler } from './product/commands/update-product/update-product.handler';
export { UpdateProductValidator } from './product/commands/update-product/update-product.validator';
export { DeleteProductHandler } from './product/commands/delete-product/delete-product.handler';
export { DeleteProductValidator } from './product/commands/delete-product/delete-product.validator';
// Product Queries
export { GetProductHandler } from './product/queries/get-product/get-product.handler';
export { GetProductValidator } from './product/queries/get-product/get-product.validator';
export { ListProductsHandler } from './product/queries/list-products/list-products.handler';
export { ListProductsValidator } from './product/queries/list-products/list-products.validator';
export { ListProductsWithStockHandler } from './product/queries/list-products-with-stock/list-products-with-stock.handler';
export { ListProductsWithStockValidator } from './product/queries/list-products-with-stock/list-products-with-stock.validator';

// Category Commands
export { CreateCategoryHandler } from './category/commands/create-category/create-category.handler';
export { CreateCategoryValidator } from './category/commands/create-category/create-category.validator';
export { UpdateCategoryHandler } from './category/commands/update-category/update-category.handler';
export { UpdateCategoryValidator } from './category/commands/update-category/update-category.validator';
// Category Queries
export { GetCategoryHandler } from './category/queries/get-category/get-category.handler';
export { GetCategoryValidator } from './category/queries/get-category/get-category.validator';
export { ListCategoriesHandler } from './category/queries/list-categories/list-categories.handler';
export { ListCategoriesValidator } from './category/queries/list-categories/list-categories.validator';

// TaxRate Commands
export { CreateTaxRateHandler } from './tax-rate/commands/create-tax-rate/create-tax-rate.handler';
export { CreateTaxRateValidator } from './tax-rate/commands/create-tax-rate/create-tax-rate.validator';
export { UpdateTaxRateHandler } from './tax-rate/commands/update-tax-rate/update-tax-rate.handler';
export { UpdateTaxRateValidator } from './tax-rate/commands/update-tax-rate/update-tax-rate.validator';
// TaxRate Queries
export { GetTaxRateHandler } from './tax-rate/queries/get-tax-rate/get-tax-rate.handler';
export { GetTaxRateValidator } from './tax-rate/queries/get-tax-rate/get-tax-rate.validator';
export { ListTaxRatesHandler } from './tax-rate/queries/list-tax-rates/list-tax-rates.handler';
export { ListTaxRatesValidator } from './tax-rate/queries/list-tax-rates/list-tax-rates.validator';

// Sale Commands
export { CreateSaleHandler } from './sale/commands/create-sale/create-sale.handler';
export { CreateSaleValidator } from './sale/commands/create-sale/create-sale.validator';
export { AddSaleDetailHandler } from './sale/commands/add-sale-detail/add-sale-detail.handler';
export { AddSaleDetailValidator } from './sale/commands/add-sale-detail/add-sale-detail.validator';
export { RemoveSaleDetailHandler } from './sale/commands/remove-sale-detail/remove-sale-detail.handler';
export { RemoveSaleDetailValidator } from './sale/commands/remove-sale-detail/remove-sale-detail.validator';
export { UpdateSaleDetailQuantityHandler } from './sale/commands/update-sale-detail-quantity/update-sale-detail-quantity.handler';
export { UpdateSaleDetailQuantityValidator } from './sale/commands/update-sale-detail-quantity/update-sale-detail-quantity.validator';
export { ConfirmSaleHandler } from './sale/commands/confirm-sale/confirm-sale.handler';
export { ConfirmSaleValidator } from './sale/commands/confirm-sale/confirm-sale.validator';
export { CancelSaleHandler } from './sale/commands/cancel-sale/cancel-sale.handler';
export { CancelSaleValidator } from './sale/commands/cancel-sale/cancel-sale.validator';
// Sale Queries
export { GetSaleHandler } from './sale/queries/get-sale/get-sale.handler';
export { GetSaleValidator } from './sale/queries/get-sale/get-sale.validator';
export { ListSalesHandler } from './sale/queries/list-sales/list-sales.handler';
export { ListSalesValidator } from './sale/queries/list-sales/list-sales.validator';

// Inventory Queries
export { GetStockLevelsHandler } from './inventory/queries/get-stock-levels/get-stock-levels.handler';
export { GetStockLevelsValidator } from './inventory/queries/get-stock-levels/get-stock-levels.validator';
export { GetMovementsHistoryHandler } from './inventory/queries/get-movements-history/get-movements-history.handler';
export { GetMovementsHistoryValidator } from './inventory/queries/get-movements-history/get-movements-history.validator';

// ErrorLog Queries
export { GetErrorLogHandler } from './error-log/queries/get-error-log/get-error-log.handler';
export { GetErrorLogValidator } from './error-log/queries/get-error-log/get-error-log.validator';
export { ListErrorLogsHandler } from './error-log/queries/list-error-logs/list-error-logs.handler';
export { ListErrorLogsValidator } from './error-log/queries/list-error-logs/list-error-logs.validator';

// Dashboard Queries
export { GetDashboardStatsHandler } from './dashboard/queries/get-dashboard-stats/get-dashboard-stats.handler';
