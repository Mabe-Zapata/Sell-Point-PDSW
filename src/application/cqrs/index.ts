// Customer Commands
export { CreateCustomerHandler } from './customer/commands/create-customer/create-customer.handler';
export { CreateCustomerValidator } from './customer/commands/create-customer/create-customer.validator';
export { UpdateCustomerHandler } from './customer/commands/update-customer/update-customer.handler';
export { UpdateCustomerValidator } from './customer/commands/update-customer/update-customer.validator';
export { DeleteCustomerHandler } from './customer/commands/delete-customer/delete-customer.handler';
export { DeleteCustomerValidator } from './customer/commands/delete-customer/delete-customer.validator';
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

// Invoice Commands
export { CreateInvoiceHandler } from './invoice/commands/create-invoice/create-invoice.handler';
export { CreateInvoiceValidator } from './invoice/commands/create-invoice/create-invoice.validator';
// Invoice Queries
export { GetInvoiceHandler } from './invoice/queries/get-invoice/get-invoice.handler';
export { GetInvoiceValidator } from './invoice/queries/get-invoice/get-invoice.validator';
export { ListInvoicesHandler } from './invoice/queries/list-invoices/list-invoices.handler';
export { ListInvoicesValidator } from './invoice/queries/list-invoices/list-invoices.validator';
export { ListInvoicesWithStockHandler } from './invoice/queries/list-invoices-with-stock/list-invoices-with-stock.handler';
export { ListInvoicesWithStockValidator } from './invoice/queries/list-invoices-with-stock/list-invoices-with-stock.validator';
export { GenerateInvoicePdfHandler } from './invoice/queries/generate-invoice-pdf/generate-invoice-pdf.handler';
export { GenerateInvoicePdfValidator } from './invoice/queries/generate-invoice-pdf/generate-invoice-pdf.validator';

// Branch Commands
export { CreateBranchHandler } from './branch/commands/create-branch/create-branch.handler';
export { CreateBranchValidator } from './branch/commands/create-branch/create-branch.validator';
export { UpdateBranchHandler } from './branch/commands/update-branch/update-branch.handler';
export { UpdateBranchValidator } from './branch/commands/update-branch/update-branch.validator';
export { DeleteBranchHandler } from './branch/commands/delete-branch/delete-branch.handler';
export { DeleteBranchValidator } from './branch/commands/delete-branch/delete-branch.validator';
// Branch Queries
export { GetBranchHandler } from './branch/queries/get-branch/get-branch.handler';
export { GetBranchValidator } from './branch/queries/get-branch/get-branch.validator';
export { ListBranchesHandler } from './branch/queries/list-branches/list-branches.handler';
export { ListBranchesValidator } from './branch/queries/list-branches/list-branches.validator';

// Warehouse Commands
export { CreateWarehouseHandler } from './warehouse/commands/create-warehouse/create-warehouse.handler';
export { CreateWarehouseValidator } from './warehouse/commands/create-warehouse/create-warehouse.validator';
export { UpdateWarehouseHandler } from './warehouse/commands/update-warehouse/update-warehouse.handler';
export { UpdateWarehouseValidator } from './warehouse/commands/update-warehouse/update-warehouse.validator';
// Warehouse Queries
export { GetWarehouseHandler } from './warehouse/queries/get-warehouse/get-warehouse.handler';
export { GetWarehouseValidator } from './warehouse/queries/get-warehouse/get-warehouse.validator';
export { ListWarehousesHandler } from './warehouse/queries/list-warehouses/list-warehouses.handler';
export { ListWarehousesValidator } from './warehouse/queries/list-warehouses/list-warehouses.validator';

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

// StockTransfer Commands
export { CreateTransferHandler } from './stock-transfer/commands/create-transfer/create-transfer.handler';
export { CreateTransferValidator } from './stock-transfer/commands/create-transfer/create-transfer.validator';
export { ApproveTransferHandler } from './stock-transfer/commands/approve-transfer/approve-transfer.handler';
export { ApproveTransferValidator } from './stock-transfer/commands/approve-transfer/approve-transfer.validator';
export { SendTransferHandler } from './stock-transfer/commands/send-transfer/send-transfer.handler';
export { SendTransferValidator } from './stock-transfer/commands/send-transfer/send-transfer.validator';
export { ReceiveTransferHandler } from './stock-transfer/commands/receive-transfer/receive-transfer.handler';
export { ReceiveTransferValidator } from './stock-transfer/commands/receive-transfer/receive-transfer.validator';
export { CancelTransferHandler } from './stock-transfer/commands/cancel-transfer/cancel-transfer.handler';
export { CancelTransferValidator } from './stock-transfer/commands/cancel-transfer/cancel-transfer.validator';
// StockTransfer Queries
export { GetTransferHandler } from './stock-transfer/queries/get-transfer/get-transfer.handler';
export { GetTransferValidator } from './stock-transfer/queries/get-transfer/get-transfer.validator';
export { ListTransfersHandler } from './stock-transfer/queries/list-transfers/list-transfers.handler';
export { ListTransfersValidator } from './stock-transfer/queries/list-transfers/list-transfers.validator';

// Payment Commands
export { CreatePaymentHandler } from './payment/commands/create-payment/create-payment.handler';
export { CreatePaymentValidator } from './payment/commands/create-payment/create-payment.validator';

// SalesHistory Queries
export { GetSalesHistoryHandler } from './sales-history/queries/get-sales-history/get-sales-history.handler';
export { GetSalesHistoryValidator } from './sales-history/queries/get-sales-history/get-sales-history.validator';

// ErrorLog Queries
export { GetErrorLogHandler } from './error-log/queries/get-error-log/get-error-log.handler';
export { GetErrorLogValidator } from './error-log/queries/get-error-log/get-error-log.validator';
export { ListErrorLogsHandler } from './error-log/queries/list-error-logs/list-error-logs.handler';
export { ListErrorLogsValidator } from './error-log/queries/list-error-logs/list-error-logs.validator';

// Dashboard Queries
export { GetDashboardStatsHandler } from './dashboard/queries/get-dashboard-stats/get-dashboard-stats.handler';