import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TopupDto } from './dto/topup.dto';
import type { Request } from 'express';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  getWallet(@Req() req: any) {
    return this.walletsService.getWallet(req.user.id);
  }

  @Post('topup')
  topup(@Body() dto: TopupDto, @Req() req: Request & any) {
    return this.walletsService.topup(req.user.id, dto, req);
  }
}