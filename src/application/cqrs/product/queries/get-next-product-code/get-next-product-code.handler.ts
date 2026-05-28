import { GetNextProductCodeQuery } from './get-next-product-code.query';
import type { IProductRepository } from '../../../../../domain/repositories';

export class GetNextProductCodeHandler {
  constructor(
    protected readonly productRepository: IProductRepository,
  ) {}

  async execute(_query: GetNextProductCodeQuery): Promise<{ code: string }> {
    return { code: await this.productRepository.getNextCode() };
  }
}
