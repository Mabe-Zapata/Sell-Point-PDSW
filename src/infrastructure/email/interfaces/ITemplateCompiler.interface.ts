export interface ITemplateCompiler {
  compile(templateName: string, data: Record<string, unknown>): Promise<string>;
}
