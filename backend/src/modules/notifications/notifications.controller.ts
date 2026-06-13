import { Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { NotificationType } from '../../entities/notification.entity';

@ApiTags('通知')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取通知记录列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('type') type?: NotificationType,
    @Query('isRead') isRead?: boolean,
  ) {
    return this.notificationService.findAll(page, pageSize, type, isRead);
  }

  @Get(':id')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Put(':id/read')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(id);
    return { message: '标记成功' };
  }

  @Get('logs')
  @Roles(UserRole.TRAINING_MANAGER)
  @ApiOperation({ summary: '获取本地通知日志' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async getLogs(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.notificationService.getLogs(page, pageSize);
  }
}