import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MfaLoginDto } from './dto/mfa-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('captcha')
  generateCaptcha() {
    return this.authService.generateCaptcha();
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  enableMfa(@Req() req: Request & any) {
    return this.authService.enableMfa(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  verifyMfa(@Body() body: { code: string }, @Req() req: Request & any) {
    return this.authService.verifyMfa(req.user.id, body.code);
  }

  @Post('mfa/login')
  mfaLogin(@Body() dto: MfaLoginDto, @Req() req: Request) {
    return this.authService.mfaLogin(dto, req);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto, @Req() req: Request & any) {
    return this.authService.logout(req.user.id, dto.refreshToken, req);
  }
}