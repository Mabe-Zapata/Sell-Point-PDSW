import { DocumentBuilder } from '@nestjs/swagger';

export const createSwaggerConfig = () =>
  new DocumentBuilder()
    .setTitle('Sell Point Backend API')
    .setDescription('Point of Sale Backend System - RESTful API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer access token for protected endpoints.',
      },
      'access-token',
    )
    .addTag('customers', 'Customer management operations')
    .addTag('products', 'Product management operations')
    .addTag('invoices', 'Invoice and sales operations')
    .addTag('dashboard', 'Dashboard and statistics operations')
    .build();
