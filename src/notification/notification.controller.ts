import { Controller, Get, Headers, Param, Put } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取当前角色的通知列表' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getNotifications(@Headers('x-user-role') role: string) {
    return this.notificationService.getNotificationsByRole(role || 'talent_agent');
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
