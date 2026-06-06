import { Controller, Get, Headers, Param, Put } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/enums';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly store: InMemoryStore,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的通知列表' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID', required: true })
  getNotifications(@Headers('x-user-id') userId: string) {
    const user = this.store.getUser(userId);
    const role = user?.role || UserRole.CLASS_TEACHER;
    return this.notificationService.getNotificationsByRole(role);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
