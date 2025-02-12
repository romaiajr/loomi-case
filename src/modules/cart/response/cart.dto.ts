import { ApiProperty } from '@nestjs/swagger';
import { CartItemDTO } from './cart-item.dto';

export class CartDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiProperty({
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 10,
        price_per_unit: 5,
        amount: 50,
        product_id: '123e4567-e89b-12d3-a456-426614174000',
      },
    ],
  })
  items: CartItemDTO[];
}
