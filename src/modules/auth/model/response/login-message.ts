import { ApiProperty } from '@nestjs/swagger';

export class LoginMessage {
  @ApiProperty({
    example:
      'Código de verificação enviado. Não me pergunte o código, já te disse 645913 vezes que não sei. ',
  })
  message: string;
}
