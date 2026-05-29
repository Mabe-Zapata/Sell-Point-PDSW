import fs from 'fs';
import path from 'path';
import { HandlebarsCompiler, TemplateNotFoundError } from './handlebars-compiler';

const TEMPLATES_DIR = path.resolve(__dirname, '../../../../src/infrastructure/email/templates');

describe('HandlebarsCompiler', () => {
  let compiler: HandlebarsCompiler;

  beforeEach(() => {
    compiler = new HandlebarsCompiler(TEMPLATES_DIR);
  });

  describe('compile', () => {
    it('should successfully compile password-reset template', async () => {
      const result = await compiler.compile('password-reset', {
        firstName: 'John',
        resetUrl: 'https://example.com/reset?token=abc123',
        expiresInMinutes: 1440,
      });

      expect(result).toContain('John');
      expect(result).toContain('https://example.com/reset?token');
      expect(result).toContain('1440');
    });

    it('should throw TemplateNotFoundError when template file does not exist', async () => {
      await expect(compiler.compile('nonexistent-template', {})).rejects.toThrow(TemplateNotFoundError);
      await expect(compiler.compile('nonexistent-template', {})).rejects.toThrow('Template not found: nonexistent-template.hbs');
    });

    it('should compile invoice template with item data', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        date: '2024-01-15',
        customerName: 'Juan Pérez',
        customerCedula: '1723456789',
        items: [
          { description: 'Product A', quantity: 2, unitPrice: 10.00, subtotal: 20.00 },
          { description: 'Product B', quantity: 1, unitPrice: 15.00, subtotal: 15.00 },
        ],
        total: 35.00,
      };

      const result = await compiler.compile('invoice', invoiceData);

      expect(result).toContain('INV-001');
      expect(result).toContain('Juan Pérez');
      expect(result).toContain('Product A');
      expect(result).toContain('35');
    });

    it('should compile new-employee-credentials template', async () => {
      const employeeData = {
        firstName: 'María',
        username: 'maria.garcia',
        temporaryPassword: 'TempPass123!',
        loginUrl: 'https://sellpoint.com/login',
      };

      const result = await compiler.compile('new-employee-credentials', employeeData);

      expect(result).toContain('María');
      expect(result).toContain('maria.garcia');
      expect(result).toContain('TempPass123!');
      expect(result).toContain('https://sellpoint.com/login');
    });

    it('should resolve templates using the default runtime-relative path', async () => {
      const defaultCompiler = new HandlebarsCompiler();

      const result = await defaultCompiler.compile('new-employee-credentials', {
        firstName: 'Ana',
        email: 'ana@example.com',
        username: 'ana.user',
        temporaryPassword: 'TempPass123!',
        loginUrl: 'https://sellpoint.com/login',
      });

      expect(result).toContain('Ana');
      expect(result).toContain('ana@example.com');
    });

    it('should compile password-change-notification template', async () => {
      const result = await compiler.compile('password-change-notification', {
        firstName: 'Carlos',
        changedAt: '2024-01-15 14:30:00',
      });

      expect(result).toContain('Carlos');
      expect(result).toContain('2024-01-15 14:30:00');
    });
  });
});
