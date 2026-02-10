import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators';
import { User } from '../database/entities';

class GoogleLoginDto {
  idToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.validateGoogleToken(dto.idToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: User) {
    return user;
  }
}
