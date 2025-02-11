import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CartItemDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
