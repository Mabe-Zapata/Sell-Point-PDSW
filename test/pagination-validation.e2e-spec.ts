import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Pagination Validation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    it('should return 400 when page=0', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?page=0')
        .expect(400);

      expect(response.body.message).toContain('La página debe ser mayor o igual a 1');
    });

    it('should return 400 when page is negative', async () => {
      await request(app.getHttpServer())
        .get('/products?page=-1')
        .expect(400);
    });

    it('should return 400 when limit=0', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?limit=0')
        .expect(400);

      expect(response.body.message).toContain('El límite debe ser mayor o igual a 1');
    });

    it('should return 400 when limit > 100', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?limit=101')
        .expect(400);

      expect(response.body.message).toContain('El límite máximo por página es 100');
    });

    it('should return 400 when limit=10000', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?limit=10000')
        .expect(400);

      expect(response.body.message).toContain('El límite máximo por página es 100');
    });

    it('should return 200 with limit=100 (max allowed)', async () => {
      await request(app.getHttpServer())
        .get('/products?limit=100')
        .expect(200);
    });

    it('should return 200 with default pagination', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(200);
    });

    it('should return 200 with valid page and limit', async () => {
      await request(app.getHttpServer())
        .get('/products?page=1&limit=20')
        .expect(200);
    });
  });

  describe('GET /customers', () => {
    it('should return 400 when page=0', async () => {
      await request(app.getHttpServer())
        .get('/customers?page=0')
        .expect(400);
    });

    it('should return 400 when limit=0', async () => {
      await request(app.getHttpServer())
        .get('/customers?limit=0')
        .expect(400);
    });

    it('should return 400 when limit > 100', async () => {
      await request(app.getHttpServer())
        .get('/customers?limit=200')
        .expect(400);
    });

    it('should return 200 with valid pagination', async () => {
      await request(app.getHttpServer())
        .get('/customers?page=1&limit=50')
        .expect(200);
    });
  });

  describe('GET /categories', () => {
    it('should return 400 when page=0', async () => {
      await request(app.getHttpServer())
        .get('/categories?page=0')
        .expect(400);
    });

    it('should return 400 when limit > 100', async () => {
      await request(app.getHttpServer())
        .get('/categories?limit=150')
        .expect(400);
    });
  });

  describe('GET /invoices', () => {
    it('should return 400 when page=0', async () => {
      await request(app.getHttpServer())
        .get('/invoices?page=0')
        .expect(400);
    });

    it('should return 400 when limit > 100', async () => {
      await request(app.getHttpServer())
        .get('/invoices?limit=500')
        .expect(400);
    });
  });

  describe('GET /sales', () => {
    it('should return 400 when page=0', async () => {
      await request(app.getHttpServer())
        .get('/sales?page=0')
        .expect(400);
    });

    it('should return 400 when limit=0', async () => {
      await request(app.getHttpServer())
        .get('/sales?limit=0')
        .expect(400);
    });
  });

  describe('GET /users (admin endpoint)', () => {
    it('should return 401 without auth (as other endpoints are protected)', async () => {
      // Note: This endpoint requires JWT, so it will return 401 before validation
      // But if we provide valid auth, then pagination validation would apply
      await request(app.getHttpServer())
        .get('/users?page=0')
        .expect(401);
    });
  });
});