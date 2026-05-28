// Application CQRS Validators Only
// Handlers are now in infrastructure/cqrs as NestJS wrappers

// Customer Commands Validators
export { CreateCustomerValidator } from './customer/commands/create-customer/create-customer.validator';
export { UpdateCustomerValidator } from './customer/commands/update-customer/update-customer.validator';
export { ActivateCustomerValidator } from './customer/commands/activate-customer/activate-customer.validator';
export { DeactivateCustomerValidator } from './customer/commands/deactivate-customer/deactivate-customer.validator';
export { DeleteCustomerValidator } from './customer/commands/delete-customer/delete-customer.validator';

// Customer Queries Validators
export { GetCustomerValidator } from './customer/queries/get-customer/get-customer.validator';
export { ListCustomersValidator } from './customer/queries/list-customers/list-customers.validator';
export { ListCustomersWithStockValidator } from './customer/queries/list-customers-with-stock/list-customers-with-stock.validator';

// User Commands Validators
export { CreateUserValidator } from './user/commands/create-user/create-user.validator';
export { UpdateUserValidator } from './user/commands/update-user/update-user.validator';
export { ActivateUserValidator } from './user/commands/activate-user/activate-user.validator';
export { DeactivateUserValidator } from './user/commands/deactivate-user/deactivate-user.validator';
export { UnlockUserValidator } from './user/commands/unlock-user/unlock-user.validator';

// User Queries Validators
export { GetUserValidator } from './user/queries/get-user/get-user.validator';
export { ListUsersValidator } from './user/queries/list-users/list-users.validator';

// Role Commands Validators
export { CreateRoleValidator } from './role/commands/create-role/create-role.validator';
export { UpdateRoleValidator } from './role/commands/update-role/update-role.validator';

// Role Queries Validators
export { GetRoleValidator } from './role/queries/get-role/get-role.validator';
export { ListRolesValidator } from './role/queries/list-roles/list-roles.validator';

// Product Commands Validators
export { CreateProductValidator } from './product/commands/create-product/create-product.validator';
export { UpdateProductValidator } from './product/commands/update-product/update-product.validator';
export { DeleteProductValidator } from './product/commands/delete-product/delete-product.validator';

// Product Queries Validators
export { GetProductValidator } from './product/queries/get-product/get-product.validator';
export { ListProductsValidator } from './product/queries/list-products/list-products.validator';
export { ListProductsWithStockValidator } from './product/queries/list-products-with-stock/list-products-with-stock.validator';

// Category Commands Validators
export { CreateCategoryValidator } from './category/commands/create-category/create-category.validator';
export { UpdateCategoryValidator } from './category/commands/update-category/update-category.validator';
export { DeleteCategoryValidator } from './category/commands/delete-category/delete-category.validator';
export { ActivateCategoryValidator } from './category/commands/activate-category/activate-category.validator';
export { DeactivateCategoryValidator } from './category/commands/deactivate-category/deactivate-category.validator';

// Category Queries Validators
export { GetCategoryValidator } from './category/queries/get-category/get-category.validator';
export { ListCategoriesValidator } from './category/queries/list-categories/list-categories.validator';

// TaxRate Commands Validators
export { CreateTaxRateValidator } from './tax-rate/commands/create-tax-rate/create-tax-rate.validator';
export { UpdateTaxRateValidator } from './tax-rate/commands/update-tax-rate/update-tax-rate.validator';

// TaxRate Queries Validators
export { GetTaxRateValidator } from './tax-rate/queries/get-tax-rate/get-tax-rate.validator';
export { ListTaxRatesValidator } from './tax-rate/queries/list-tax-rates/list-tax-rates.validator';

// Sale Commands Validators
export { CreateSaleValidator } from './sale/commands/create-sale/create-sale.validator';
export { AddSaleDetailValidator } from './sale/commands/add-sale-detail/add-sale-detail.validator';
export { RemoveSaleDetailValidator } from './sale/commands/remove-sale-detail/remove-sale-detail.validator';
export { UpdateSaleDetailQuantityValidator } from './sale/commands/update-sale-detail-quantity/update-sale-detail-quantity.validator';
export { ConfirmSaleValidator } from './sale/commands/confirm-sale/confirm-sale.validator';
export { CancelSaleValidator } from './sale/commands/cancel-sale/cancel-sale.validator';
export { QuickConfirmSaleValidator } from './sale/commands/quick-confirm-sale/quick-confirm-sale.validator';

// Sale Queries Validators
export { GetSaleValidator } from './sale/queries/get-sale/get-sale.validator';
export { ListSalesValidator } from './sale/queries/list-sales/list-sales.validator';

// Inventory Commands Validators
export { AdjustStockValidator } from './inventory/commands/adjust-stock/adjust-stock.validator';

// Inventory Queries Validators
export { GetStockLevelsValidator } from './inventory/queries/get-stock-levels/get-stock-levels.validator';
export { GetMovementsHistoryValidator } from './inventory/queries/get-movements-history/get-movements-history.validator';

// ErrorLog Queries Validators
export { GetErrorLogValidator } from './error-log/queries/get-error-log/get-error-log.validator';
export { ListErrorLogsValidator } from './error-log/queries/list-error-logs/list-error-logs.validator';

// Auth Handlers Validators
export { RegisterEmployeeValidator } from './auth/handlers/register-employee/register-employee.validator';
export { RequestPasswordResetValidator } from './auth/handlers/request-password-reset/request-password-reset.validator';
export { ResetPasswordValidator } from './auth/handlers/reset-password/reset-password.validator';