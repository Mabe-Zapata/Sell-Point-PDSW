import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { ITemplateCompiler } from '../interfaces/ITemplateCompiler.interface';

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

export class TemplateNotFoundError extends Error {
  constructor(templateName: string) {
    super(`Template not found: ${templateName}.hbs`);
    this.name = 'TemplateNotFoundError';
  }
}

export class HandlebarsCompiler implements ITemplateCompiler {
  private readonly templatesPath: string;

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath ?? path.resolve(process.cwd(), 'src/infrastructure/email/templates');
  }

  async compile(templateName: string, data: Record<string, unknown>): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);

    if (!fs.existsSync(templatePath)) {
      throw new TemplateNotFoundError(templateName);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    return template(data);
  }
}
