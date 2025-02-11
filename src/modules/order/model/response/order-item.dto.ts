import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 10 })
  quantity: number;

  @ApiProperty({ example: 5 })
  price_per_unit: number;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  product_id: string;
}
