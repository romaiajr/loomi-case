import { ApiProperty } from '@nestjs/swagger';
import { UserDTO } from './user.dto';

export class ClientDTO extends UserDTO {
  @ApiProperty({ example: '(12) 12345-6789' })
  contact: string;

  @ApiProperty({ example: 'Rua X' })
  address: string;
}
