import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@enums/user-type';

export class UserDTO {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Roberto Maia' })
  name: string;

  @ApiProperty({ example: 'romaiajr.dev@gmail.com' })
  email: string;

  @ApiProperty({ example: UserType.CLIENT })
  type: UserType;
}
