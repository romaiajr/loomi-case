import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiResponse } from '@nestjs/swagger';
import { JwtToken } from './model/response/jwt-token';
import { LoginMessage } from './model/response/login-message';
import { LoginDTO } from './model/request/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ type: LoginMessage })
  @Post('login')
  async login(@Body() body: LoginDTO) {
    return this.authService.login(body.email, body.password);
  }

  @ApiResponse({ type: JwtToken })
  @Post('code')
  async verifyCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyCode(body.email, body.code);
  }
}
