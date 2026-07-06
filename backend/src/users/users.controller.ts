import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }
}