import { ApiProperty } from '@nestjs/swagger';
export class JwtToken {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvbWFpYWpyLmRldjRAZ21haWwuY29tIiwic3ViIjoiMjRiMmNjYTEtYmVjMi00ZDc0LTllNjctNTE4ZjE1Yjc5ODBlIiwidHlwZSI6MSwiaWF0IjoxNzM5MDQ1NzQ3fQ.OSYsIBU3GKOkLijceFxjzD6ZDZhPQA_Uc3xCxjH5QI0',
  })
  access_token: string;
}
