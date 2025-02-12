import { OrderStatus } from '@enums/order-status';
import { PaymentStatus } from '@enums/payment-status';
import { ApiProperty } from '@nestjs/swagger';
import { OrderItemDTO } from './order-item.dto';

export class OrderDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiProperty({ example: PaymentStatus.PENDING })
  payment_status: PaymentStatus;

  @ApiProperty({ example: OrderStatus.PROCESSING })
  order_status: OrderStatus;

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
  items: OrderItemDTO[];

  @ApiProperty({
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    example: new Date(),
  })
  updated_at: Date;

  @ApiProperty({
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    example: new Date(),
  })
  inactivated_at: Date;
}
