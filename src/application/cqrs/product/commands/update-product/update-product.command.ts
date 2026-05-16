import { UpdateProductDto } from '../../../../dto/product/update-product.dto';

export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly payload: UpdateProductDto,
  ) {}
}
