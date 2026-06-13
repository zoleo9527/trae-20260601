import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { Notification } from '../../entities/notification.entity';
import { NotificationLog } from '../../entities/notification-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationLog])],
  controllers: [NotificationsController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}