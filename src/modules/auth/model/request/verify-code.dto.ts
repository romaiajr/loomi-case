import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail({})
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(6)
  code!: string;
}
