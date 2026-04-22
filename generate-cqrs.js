const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'application', 'cqrs');

const entities = {
  customer: [
    { name: 'create-customer', type: 'command', isCommand: true },
    { name: 'update-customer', type: 'command', isCommand: true },
    { name: 'delete-customer', type: 'command', isCommand: true },
    { name: 'get-customer', type: 'query', isCommand: false },
    { name: 'list-customers', type: 'query', isCommand: false },
  ],
  product: [
    { name: 'create-product', type: 'command', isCommand: true },
    { name: 'update-product', type: 'command', isCommand: true },
    { name: 'delete-product', type: 'command', isCommand: true },
    { name: 'get-product', type: 'query', isCommand: false },
    { name: 'list-products', type: 'query', isCommand: false },
  ],
  invoice: [
    { name: 'create-invoice', type: 'command', isCommand: true },
    { name: 'get-invoice', type: 'query', isCommand: false },
    { name: 'list-invoices', type: 'query', isCommand: false },
    { name: 'generate-invoice-pdf', type: 'query', isCommand: false },
  ]
};

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

for (const [entity, operations] of Object.entries(entities)) {
  for (const op of operations) {
    const pluralType = op.isCommand ? 'commands' : 'queries';
    const classDir = path.join(srcDir, entity, pluralType, op.name);
    
    fs.mkdirSync(classDir, { recursive: true });

    const kebabEntity = op.name; // e.g. create-customer
    const PascalEntity = toPascalCase(kebabEntity); // e.g. CreateCustomer

    // 1. Command/Query file
    const payloadContent = `export class ${PascalEntity}${op.isCommand ? 'Command' : 'Query'} {
  constructor(public readonly payload: any) {}
}
`;
    fs.writeFileSync(path.join(classDir, `${kebabEntity}.${op.type}.ts`), payloadContent);

    // 2. Validator file
    const validatorContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${PascalEntity}Validator {
  async validate(payload: any): Promise<void> {
    // Validaciones de negocio antes de enviar al handler
  }
}
`;
    fs.writeFileSync(path.join(classDir, `${kebabEntity}.validator.ts`), validatorContent);

    // 3. Handler file
    const cqrsDecorator = op.isCommand ? 'CommandHandler' : 'QueryHandler';
    const cqrsInterface = op.isCommand ? 'ICommandHandler' : 'IQueryHandler';
    const importCqrs = `import { ${cqrsDecorator}, ${cqrsInterface} } from '@nestjs/cqrs';`;
    
    const handlerContent = `${importCqrs}
import { ${PascalEntity}${op.isCommand ? 'Command' : 'Query'} } from './${kebabEntity}.${op.type}';
import { ${PascalEntity}Validator } from './${kebabEntity}.validator';

@${cqrsDecorator}(${PascalEntity}${op.isCommand ? 'Command' : 'Query'})
export class ${PascalEntity}Handler implements ${cqrsInterface}<${PascalEntity}${op.isCommand ? 'Command' : 'Query'}> {
  constructor(private readonly validator: ${PascalEntity}Validator) {}

  async execute(${op.isCommand ? 'command' : 'query'}: ${PascalEntity}${op.isCommand ? 'Command' : 'Query'}): Promise<any> {
    await this.validator.validate(${op.isCommand ? 'command' : 'query'}.payload);
    // Ejecución de la lógica central
  }
}
`;
    fs.writeFileSync(path.join(classDir, `${kebabEntity}.handler.ts`), handlerContent);
  }
}

console.log('CQRS structure generated successfully in src/application/cqrs/');
