import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumberString,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class ExpirationDate {
  @ApiProperty({ example: '12' })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1, { message: 'O mês deve ser entre 1 e 12' })
  @Max(12, { message: 'O mês deve ser entre 1 e 12' })
  month: number;

  @ApiProperty({ example: 2028 })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(new Date().getFullYear(), { message: 'O ano deve ser no futuro' }) // 🔹 Ano deve ser no mínimo o atual
  year: number;
}

class PaymentInfo {
  @ApiProperty({ example: 'João Silva' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '4111111111111111' })
  @IsNotEmpty()
  @IsNumberString()
  @Length(16, 16)
  card_number: string;

  @ApiProperty({ type: ExpirationDate })
  @ValidateNested()
  @Type(() => ExpirationDate)
  expiration_date: ExpirationDate;

  @ApiProperty({ example: '123' })
  @IsNotEmpty()
  @IsNumberString()
  @Length(3, 3)
  cvv: string;
}

export class CreateOrderPayment {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsString()
  order_id: string;

  @ApiProperty({ type: PaymentInfo })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PaymentInfo)
  payment_info: PaymentInfo;
}
