import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import type { Request } from 'express';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  @Post()
  createTransfer(
    @Body() dto: CreateTransferDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @Req() req: Request & any,
  ) {
    return this.service.createTransfer(
      req.user.id,
      dto,
      idempotencyKey,
      req,
    );
  }

  @Post(':uuid/confirm')
  confirmTransfer(
    @Param('uuid') uuid: string,
    @Body() dto: ConfirmTransferDto,
    @Req() req: Request & any,
  ) {
    return this.service.confirmTransfer(
      req.user.id,
      uuid,
      dto,
      req,
    );
  }
}