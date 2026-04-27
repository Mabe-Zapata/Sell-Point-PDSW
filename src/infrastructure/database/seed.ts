import 'reflect-metadata';
import { dataSource } from '../../config/typeorm.config';
import { CustomerTypeOrmEntity } from './entities/customer.typeorm.entity';
import { ProductTypeOrmEntity } from './entities/product.typeorm.entity';
import { InvoiceTypeOrmEntity } from './entities/invoice.typeorm.entity';
import { InvoiceItemTypeOrmEntity } from './entities/invoice-item.typeorm.entity';

type SeedCustomer = Pick<CustomerTypeOrmEntity, 'name' | 'lastName' | 'cedula' | 'email' | 'phone' | 'address'>;
type SeedProduct = Pick<ProductTypeOrmEntity, 'code' | 'name' | 'description' | 'unitPrice' | 'availableQuantity'>;

const TARGET_COUNTS = {
  customers: 750,
  products: 540,
  invoices: 150,
} as const;

const FIRST_NAMES = [
  'Ana', 'Luis', 'María', 'Carlos', 'Sofía', 'Pedro', 'Lucía', 'Andrés', 'Valeria', 'Miguel',
  'Camila', 'Jorge', 'Daniela', 'José', 'Paula', 'Fernando', 'Elena', 'Mateo', 'Nicolás', 'Gabriela',
  'Ricardo', 'Adriana', 'Esteban', 'Juliana', 'Hugo', 'Mónica', 'Santiago', 'Patricia', 'Diego', 'Claudia',
];

const LAST_NAMES = [
  'Pérez', 'Gómez', 'Vega', 'Ruiz', 'Mendoza', 'Torres', 'Flores', 'Castro', 'López', 'Santos',
  'Ramírez', 'Ortega', 'Navarro', 'Reyes', 'Acosta', 'Delgado', 'Morales', 'Herrera', 'Cabrera', 'Vargas',
  'Córdova', 'Salazar', 'Ponce', 'Lara', 'Ibarra', 'Quintero', 'Villacrés', 'Molina', 'Rojas', 'Arias',
];

const STREETS = [
  'Av. Central', 'Calle 10', 'Av. 9 de Octubre', 'Norte', 'Sur', 'La Pradera', 'Cdla. Sol', 'Miraflores',
  'Bosque', 'Paseo del Parque', 'Los Álamos', 'Santa Ana', 'La Floresta', 'El Prado', 'San José',
];

const PRODUCT_ADJECTIVES = [
  'Pro', 'Smart', 'Ultra', 'Prime', 'Flex', 'Max', 'Lite', 'Neo', 'X', 'Elite', 'Plus', 'Air', 'HD', 'Pulse',
];

const PRODUCT_NOUNS = [
  'Laptop', 'Mouse', 'Teclado', 'Monitor', 'Auriculares', 'Silla', 'Webcam', 'SSD', 'Disco', 'Router',
  'Tablet', 'Impresora', 'Cargador', 'Mochila', 'Micrófono', 'Altavoz', 'Soporte', 'Hub USB', 'Router WiFi', 'Fuente',
];

const PRODUCT_FEATURES = [
  'con garantía extendida', 'para oficina', 'para estudio', 'de alto rendimiento', 'compacto', 'inalámbrico',
  'ergonómico', 'recargable', 'antirruido', 'con iluminación RGB', 'resistente', 'portátil', 'profesional',
];

const currency = (value: number) => Math.round(value * 100) / 100;

const seededRandom = (seed: number) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const pick = <T>(values: T[], index: number) => values[index % values.length];

const uniqueCode = (prefix: string, index: number) => `${prefix}-${String(index + 1).padStart(4, '0')}`;

const formatInvoiceNumber = (date: Date, sequence: number) => {
  const datePrefix = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${datePrefix}-${String(sequence).padStart(5, '0')}`;
};

const buildCustomers = (): SeedCustomer[] => {
  const customers: SeedCustomer[] = [];

  for (let i = 0; i < TARGET_COUNTS.customers; i += 1) {
    const first = pick(FIRST_NAMES, i);
    const last = pick(LAST_NAMES, Math.floor(i / FIRST_NAMES.length) + i);
    const street = pick(STREETS, i * 3);
    const cedula = `${String(9000000000 + i).slice(0, 10)}`;

    customers.push({
      name: first,
      lastName: `${last} ${String.fromCharCode(65 + (i % 26))}`,
      cedula,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-záéíóúñ]/gi, '')}.${i + 1}@mail.com`,
      phone: `09${String(1000000 + i).slice(-7)}`,
      address: `${street} ${100 + (i % 700)}`,
    });
  }

  return customers;
};

const buildProducts = (): SeedProduct[] => {
  const products: SeedProduct[] = [];

  for (let i = 0; i < TARGET_COUNTS.products; i += 1) {
    const adjective = pick(PRODUCT_ADJECTIVES, i);
    const noun = pick(PRODUCT_NOUNS, Math.floor(i / PRODUCT_ADJECTIVES.length) + i * 2);
    const feature = pick(PRODUCT_FEATURES, i * 5);
    const basePrice = 12 + ((i * 17) % 380) + (i % 7) * 0.99;
    const stock = 5 + ((i * 13) % 250);

    products.push({
      code: uniqueCode('PRO', i),
      name: `${noun} ${adjective}`,
      description: `${noun} ${adjective.toLowerCase()} ${feature}`,
      unitPrice: currency(basePrice),
      availableQuantity: stock,
    });
  }

  return products;
};

const startOfCurrentWeek = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const buildInvoiceDates = () => {
  const dates: Date[] = [];
  const year = new Date().getFullYear();
  const weekStart = startOfCurrentWeek();

  for (let i = 0; i < 30; i += 1) {
    const weekday = i % 7;
    const cycle = Math.floor(i / 7);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + weekday);
    date.setHours(9 + cycle, (weekday * 11 + cycle * 7) % 60, (weekday * 17 + cycle * 13) % 60, 0);
    dates.push(date);
  }

  for (let round = 0; round < 10; round += 1) {
    for (let month = 0; month < 12; month += 1) {
      const monthDays = new Date(year, month + 1, 0).getDate();
      const day = 1 + ((round * 5 + month * 3) % monthDays);
      const date = new Date(year, month, day);
      date.setHours(8 + ((round + month) % 10), (round * 13 + month * 7) % 60, (round * 17 + month * 11) % 60, 0);
      dates.push(date);
      if (dates.length === TARGET_COUNTS.invoices) return dates;
    }
  }

  return dates.slice(0, TARGET_COUNTS.invoices);
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

async function main() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  const random = seededRandom(20260426);
  const invoiceDates = buildInvoiceDates();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryRunner.query('DELETE FROM `INVOICE_ITEMS`');
    await queryRunner.query('DELETE FROM `INVOICES`');
    await queryRunner.query('DELETE FROM `PRODUCTS`');
    await queryRunner.query('DELETE FROM `CUSTOMERS`');
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    const customerRepo = queryRunner.manager.getRepository(CustomerTypeOrmEntity);
    const productRepo = queryRunner.manager.getRepository(ProductTypeOrmEntity);
    const invoiceRepo = queryRunner.manager.getRepository(InvoiceTypeOrmEntity);
    const invoiceItemRepo = queryRunner.manager.getRepository(InvoiceItemTypeOrmEntity);

    const customers = buildCustomers();
    const products = buildProducts();

    const savedCustomers = [] as CustomerTypeOrmEntity[];
    for (const group of chunk(customers, 150)) {
      const saved = await customerRepo.save(group.map((customer) => customerRepo.create(customer)));
      savedCustomers.push(...saved);
    }

    const savedProducts = [] as ProductTypeOrmEntity[];
    for (const group of chunk(products, 120)) {
      const saved = await productRepo.save(group.map((product) => productRepo.create(product)));
      savedProducts.push(...saved);
    }

    for (let i = 0; i < TARGET_COUNTS.invoices; i += 1) {
      const customer = savedCustomers[i % savedCustomers.length];
      const date = invoiceDates[i];
      const itemCount = 2 + (i % 4);
      const usedCodes = new Set<string>();
      const invoiceItems = [] as { productId: string; quantity: number; unitPrice: number }[];

      for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
        const product = savedProducts[(i * 19 + itemIndex * 7) % savedProducts.length];
        if (usedCodes.has(product.code)) continue;
        usedCodes.add(product.code);

        const quantity = 1 + Math.floor(random() * 4) + (i % 3 === 0 ? 1 : 0);
        const unitPrice = currency(Number(product.unitPrice));

        invoiceItems.push({
          productId: product.id,
          quantity,
          unitPrice,
        });
      }

      const subtotal = currency(invoiceItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
      const iva = currency(subtotal * 0.15);
      const total = currency(subtotal + iva);

      const datePrefix = date.toISOString().slice(0, 10).replace(/-/g, '');
      const sameDayCount = await invoiceRepo
        .createQueryBuilder('invoice')
        .where('DATE_FORMAT(invoice.invoiceDate, \'%Y%m%d\') = :datePrefix', { datePrefix })
        .getCount();

      const savedInvoice = await invoiceRepo.save(invoiceRepo.create({
        invoiceNumber: formatInvoiceNumber(date, sameDayCount + 1),
        invoiceDate: date,
        customerId: customer.id,
        subtotal,
        iva,
        total,
      }));

      await invoiceItemRepo.save(invoiceItems.map((item) => invoiceItemRepo.create({
        invoiceId: savedInvoice.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })));
    }

    await queryRunner.commitTransaction();
    process.stdout.write(`Seed completed: ${TARGET_COUNTS.customers} customers, ${TARGET_COUNTS.products} products, ${TARGET_COUNTS.invoices} invoices.\n`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch {
      // ignore cleanup failures if connection is already closing
    }
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
