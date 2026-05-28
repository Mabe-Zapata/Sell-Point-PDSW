// Infrastructure CQRS Wrappers
// These wrappers extend pure TypeScript handlers from application/ layer
// and add NestJS @CommandHandler/@QueryHandler decorators for framework integration.

// Customer Commands
export { CreateCustomerHandler } from './customer/commands/create-customer/create-customer.handler';
export { UpdateCustomerHandler } from './customer/commands/update-customer/UpdateCustomerHandler';
export { ActivateCustomerHandler } from './customer/commands/activate-customer/ActivateCustomerHandler';
export { DeactivateCustomerHandler } from './customer/commands/deactivate-customer/DeactivateCustomerHandler';
export { DeleteCustomerHandler } from './customer/commands/delete-customer/DeleteCustomerHandler';

// Customer Queries
export { GetCustomerHandler } from './customer/queries/get-customer/GetCustomerHandler';
export { ListCustomersHandler } from './customer/queries/list-customers/ListCustomersHandler';
export { ListCustomersWithStockHandler } from './customer/queries/list-customers-with-stock/ListCustomersWithStockHandler';

// Product Commands
export { CreateProductHandler } from './product/commands/create-product/CreateProductHandler';
export { UpdateProductHandler } from './product/commands/update-product/UpdateProductHandler';
export { DeleteProductHandler } from './product/commands/delete-product/DeleteProductHandler';
export { ActivateProductHandler } from './product/commands/activate-product/ActivateProductHandler';
export { DeactivateProductHandler } from './product/commands/deactivate-product/DeactivateProductHandler';

// Product Queries
export { GetProductHandler } from './product/queries/get-product/GetProductHandler';
export { ListProductsHandler } from './product/queries/list-products/ListProductsHandler';
export { ListProductsWithStockHandler } from './product/queries/list-products-with-stock/ListProductsWithStockHandler';

// Category Commands
export { CreateCategoryHandler } from './category/commands/create-category/CreateCategoryHandler';
export { UpdateCategoryHandler } from './category/commands/update-category/UpdateCategoryHandler';
export { DeleteCategoryHandler } from './category/commands/delete-category/DeleteCategoryHandler';
export { ActivateCategoryHandler } from './category/commands/activate-category/ActivateCategoryHandler';
export { DeactivateCategoryHandler } from './category/commands/deactivate-category/DeactivateCategoryHandler';

// Category Queries
export { GetCategoryHandler } from './category/queries/get-category/GetCategoryHandler';
export { ListCategoriesHandler } from './category/queries/list-categories/ListCategoriesHandler';

// TaxRate Commands
export { CreateTaxRateHandler } from './tax-rate/commands/create-tax-rate/CreateTaxRateHandler';
export { UpdateTaxRateHandler } from './tax-rate/commands/update-tax-rate/UpdateTaxRateHandler';

// TaxRate Queries
export { GetTaxRateHandler } from './tax-rate/queries/get-tax-rate/GetTaxRateHandler';
export { ListTaxRatesHandler } from './tax-rate/queries/list-tax-rates/ListTaxRatesHandler';

// User Commands
export { CreateUserHandler } from './user/commands/create-user/CreateUserHandler';
export { UpdateUserHandler } from './user/commands/update-user/UpdateUserHandler';
export { ActivateUserHandler } from './user/commands/activate-user/ActivateUserHandler';
export { DeactivateUserHandler } from './user/commands/deactivate-user/DeactivateUserHandler';
export { UnlockUserHandler } from './user/commands/unlock-user/UnlockUserHandler';

// User Queries
export { GetUserHandler } from './user/queries/get-user/GetUserHandler';
export { ListUsersHandler } from './user/queries/list-users/ListUsersHandler';

// Role Commands
export { CreateRoleHandler } from './role/commands/create-role/CreateRoleHandler';
export { UpdateRoleHandler } from './role/commands/update-role/UpdateRoleHandler';

// Role Queries
export { GetRoleHandler } from './role/queries/get-role/GetRoleHandler';
export { ListRolesHandler } from './role/queries/list-roles/ListRolesHandler';

// Sale Commands
export { CreateSaleHandler } from './sale/commands/create-sale/CreateSaleHandler';
export { AddSaleDetailHandler } from './sale/commands/add-sale-detail/AddSaleDetailHandler';
export { RemoveSaleDetailHandler } from './sale/commands/remove-sale-detail/RemoveSaleDetailHandler';
export { UpdateSaleDetailQuantityHandler } from './sale/commands/update-sale-detail-quantity/UpdateSaleDetailQuantityHandler';
export { ConfirmSaleHandler } from './sale/commands/confirm-sale/ConfirmSaleHandler';
export { CancelSaleHandler } from './sale/commands/cancel-sale/CancelSaleHandler';
export { QuickConfirmSaleHandler } from './sale/commands/quick-confirm-sale/QuickConfirmSaleHandler';

// Sale Queries
export { GetSaleHandler } from './sale/queries/get-sale/GetSaleHandler';
export { ListSalesHandler } from './sale/queries/list-sales/ListSalesHandler';

// Inventory Commands
export { AdjustStockHandler } from './inventory/commands/adjust-stock/AdjustStockHandler';

// Inventory Queries
export { GetStockLevelsHandler } from './inventory/queries/get-stock-levels/GetStockLevelsHandler';
export { GetMovementsHistoryHandler } from './inventory/queries/get-movements-history/GetMovementsHistoryHandler';

// ErrorLog Queries
export { GetErrorLogHandler } from './error-log/queries/get-error-log/GetErrorLogHandler';
export { ListErrorLogsHandler } from './error-log/queries/list-error-logs/ListErrorLogsHandler';

// Dashboard Queries
export { GetDashboardStatsHandler } from './dashboard/queries/get-dashboard-stats/GetDashboardStatsHandler';

// Auth Handlers
export { RegisterEmployeeHandler } from './auth/handlers/register-employee/RegisterEmployeeHandler';
export { RequestPasswordResetHandler } from './auth/handlers/request-password-reset/RequestPasswordResetHandler';
export { ResetPasswordHandler } from './auth/handlers/reset-password/ResetPasswordHandler';