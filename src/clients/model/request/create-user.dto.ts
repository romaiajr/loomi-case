import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  ValidateIf,
  Matches,
} from 'class-validator';
import { UserType } from 'src/enums/user-type';

export class CreateUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail({})
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'A senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial',
  })
  password!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(UserType)
  type!: UserType;

  @ApiPropertyOptional()
  @ValidateIf((obj: CreateUserDTO) => obj.type === UserType.CLIENT)
  @IsNotEmpty()
  @IsString()
  @Matches(/^\(?\d{2}\)?\s?\d{5}-?\d{4}$/, {
    message: 'O número de telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  contact?: string;

  @ApiPropertyOptional()
  @ValidateIf((obj: CreateUserDTO) => obj.type === UserType.CLIENT)
  @IsNotEmpty()
  @IsString()
  address?: string;
}
