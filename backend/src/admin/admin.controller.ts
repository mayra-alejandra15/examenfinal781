import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:uuid/block')
  blockOrUnblockUser(
    @Param('uuid') uuid: string,
    @Body() body: { blocked: boolean },
  ) {
    return this.adminService.blockOrUnblockUser(uuid, body.blocked);
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs(page, limit);
  }
}