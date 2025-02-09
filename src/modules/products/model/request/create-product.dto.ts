import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProductDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsOptional()
  description!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stock_quantity!: number;
}
