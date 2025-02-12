import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { CartItemDTO } from './cart-item.dto';

export class AddItemToCartDTO {
  @ApiProperty({ type: CartItemDTO })
  @IsNotEmpty()
  @Type(() => CartItemDTO)
  @ValidateNested()
  @IsObject()
  item: CartItemDTO;
}
