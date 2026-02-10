import { Controller, Post, Body, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators';
import { User } from '../database/entities';

class GoogleLoginDto {
  idToken: string;
}

class DevLoginDto {
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('google')
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.validateGoogleToken(dto.idToken);
  }

  @Post('dev-login')
  async devLogin(@Body() dto: DevLoginDto) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Not available in production');
    }
    return this.authService.devLogin(dto.email);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: User) {
    return user;
  }
}
