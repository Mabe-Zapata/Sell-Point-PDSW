const fs = require('fs');
const path = require('path');

const controllers = ['customer.controller.ts', 'product.controller.ts', 'invoice.controller.ts'];
const basePath = path.join(__dirname, 'src', 'presentation', 'controllers');

for (const ctrl of controllers) {
  const filePath = path.join(basePath, ctrl);
  if (!fs.existsSync(filePath)) continue;
  
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace use case imports with cqrs imports
  // Just remove them actually, we'll append the CQRS imports at the top
  code = code.replace(/import .*UseCase.* from '.*';\n/g, '');
  
  // Add CommandBus, QueryBus if needed
  if (!code.includes('CommandBus')) {
    code = code.replace(/import {([^}]+)} from '@nestjs\/common';/g, "import {$1} from '@nestjs/common';\nimport { CommandBus, QueryBus } from '@nestjs/cqrs';");
  }

  const name = ctrl.split('.')[0];
  const PascalName = name.charAt(0).toUpperCase() + name.slice(1);

  // Add specific commands and queries imports
  const cqrsImports = `
import { Create${PascalName}Command } from '../../application/cqrs/${name}/commands/create-${name}/create-${name}.command';
import { Get${PascalName}Query } from '../../application/cqrs/${name}/queries/get-${name}/get-${name}.query';
import { List${PascalName}sQuery } from '../../application/cqrs/${name}/queries/list-${name}s/list-${name}s.query';
`;
  code = code.replace(/import { [^}]+ } from '..\/..\/domain\/entities/g, cqrsImports + "\n$&");
  
  // Specific for Customer and Product
  if (name !== 'invoice') {
    const updateDelete = `
import { Update${PascalName}Command } from '../../application/cqrs/${name}/commands/update-${name}/update-${name}.command';
import { Delete${PascalName}Command } from '../../application/cqrs/${name}/commands/delete-${name}/delete-${name}.command';
`;
    code = code.replace(cqrsImports, cqrsImports + updateDelete);
  } else {
    // Specific for Invoice
    const invoicePdf = `import { GenerateInvoicePdfQuery } from '../../application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.query';\n`;
    code = code.replace(cqrsImports, cqrsImports + invoicePdf);
  }

  // Replace Constructor
  const constructorRegex = /constructor\s*\([\s\S]*?\)\s*\{/;
  code = code.replace(constructorRegex, `constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {`);

  // Replace calls
  code = code.replace(/await this\\.create[a-zA-Z]+UseCase\\.execute\\((.*?)\\)/g, "await this.commandBus.execute(new Create" + PascalName + "Command($1))");
  code = code.replace(/await this\\.get[a-zA-Z]+UseCase\\.execute\\((.*?)\\)/g, "await this.queryBus.execute(new Get" + PascalName + "Query($1))");
  code = code.replace(/await this\\.list[a-zA-Z]+UseCase\\.execute\\((.*?), (.*?)\\)/g, "await this.queryBus.execute(new List" + PascalName + "sQuery($1, $2))");
  code = code.replace(/await this\\.update[a-zA-Z]+UseCase\\.execute\\((.*?), (.*?)\\)/g, "await this.commandBus.execute(new Update" + PascalName + "Command($1, $2))");
  code = code.replace(/await this\\.delete[a-zA-Z]+UseCase\\.execute\\((.*?)\\)/g, "await this.commandBus.execute(new Delete" + PascalName + "Command($1))");
  code = code.replace(/await this\\.generateInvoicePdfUseCase\\.execute\\((.*?)\\)/g, "await this.queryBus.execute(new GenerateInvoicePdfQuery($1))");

  fs.writeFileSync(filePath, code);
  console.log('Refactored', filePath);
}
