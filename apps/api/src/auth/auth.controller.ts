import { Controller, Post, Body, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators';
import { User } from '../database/entities';

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

class DevLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

class PasswordLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class LocalLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
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

  @Post('password-login')
  async passwordLogin(@Body() dto: PasswordLoginDto) {
    return this.authService.passwordLogin(dto.email, dto.password);
  }

  @Post('dev-login')
  async devLogin(@Body() dto: DevLoginDto) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Não disponível em produção');
    }
    return this.authService.devLogin(dto.email);
  }

  @Post('local-login')
  async localLogin(@Body() dto: LocalLoginDto) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Não disponível em produção');
    }
    return this.authService.localAdminLogin(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: User) {
    return user;
  }
}
