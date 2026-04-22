import { CreateProductDto } from '../../../../dto/product/create-product.dto';

export class CreateProductCommand {
  constructor(public readonly payload: CreateProductDto) {}
}
