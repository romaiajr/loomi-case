import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Produto Exemplo' })
  name: string;

  @ApiPropertyOptional({ example: 'Descrição do Produto Exemplo' })
  description: string;

  @ApiProperty({ example: 5 })
  price: number;

  @ApiProperty({ example: 20 })
  stock_quantity: number;
}
