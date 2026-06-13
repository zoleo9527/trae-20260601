import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { NotificationLog } from '../../entities/notification-log.entity';

@Injectable()
export class NotificationService {
  private readonly logDir = 'logs/notifications';

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
  ) {
    this.ensureLogDir();
  }

  private ensureLogDir() {
    const dir = path.join(process.cwd(), this.logDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async sendNotification(
    type: NotificationType,
    recipientId: string,
    title: string,
    content: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      type,
      recipientId,
      title,
      content,
      relatedEntityType,
      relatedEntityId,
    });
    await this.notificationRepository.save(notification);

    const triggerResult = await this.triggerNotification(notification);

    await this.logNotification(notification, triggerResult);
  }

  private async triggerNotification(
    notification: Notification,
  ): Promise<{ result: 'success' | 'failed'; error?: string }> {
    try {
      console.log(`[Notification] ${notification.type} sent to ${notification.recipientId}`);
      return { result: 'success' };
    } catch (error) {
      return { result: 'failed', error: error.message };
    }
  }

  private async logNotification(
    notification: Notification,
    triggerResult: { result: 'success' | 'failed'; error?: string },
  ): Promise<void> {
    const today = dayjs().format('YYYY-MM-DD');
    const logFileName = `${today}.json`;
    const logFilePath = path.join(process.cwd(), this.logDir, logFileName);

    const notificationLog = this.notificationLogRepository.create({
      notificationId: notification.id,
      triggerTime: new Date(),
      triggerResult: triggerResult.result,
      errorMessage: triggerResult.error,
      logFilePath,
    });
    await this.notificationLogRepository.save(notificationLog);

    const logEntry = {
      id: notificationLog.id,
      notificationId: notification.id,
      triggerTime: notificationLog.triggerTime,
      triggerResult: notificationLog.triggerResult,
      errorMessage: notificationLog.errorMessage,
      recipient: {
        id: notification.recipientId,
      },
      notification: {
        type: notification.type,
        title: notification.title,
        content: notification.content,
      },
    };

    let logs = [];
    if (fs.existsSync(logFilePath)) {
      const fileContent = fs.readFileSync(logFilePath, 'utf-8');
      logs = JSON.parse(fileContent);
    }
    logs.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
  }

  async findAll(page: number = 1, pageSize: number = 10, type?: NotificationType, isRead?: boolean) {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.recipient', 'recipient');

    if (type) {
      query.andWhere('n.type = :type', { type });
    }

    if (isRead !== undefined) {
      query.andWhere('n.is_read = :isRead', { isRead });
    }

    query.orderBy('n.createdAt', 'DESC');

    const [items, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        recipient: {
          id: item.recipient.id,
          name: item.recipient.name,
        },
        title: item.title,
        content: item.content,
        relatedEntity: {
          type: item.relatedEntityType,
          id: item.relatedEntityId,
        },
        isRead: item.isRead,
        createdAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['recipient'],
    });

    if (!notification) {
      return null;
    }

    return {
      id: notification.id,
      type: notification.type,
      recipient: {
        id: notification.recipient.id,
        name: notification.recipient.name,
      },
      title: notification.title,
      content: notification.content,
      relatedEntity: {
        type: notification.relatedEntityType,
        id: notification.relatedEntityId,
      },
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, { isRead: true });
  }

  async getLogs(page: number = 1, pageSize: number = 10) {
    const query = this.notificationLogRepository
      .createQueryBuilder('nl')
      .leftJoinAndSelect('nl.notification', 'notification')
      .leftJoinAndSelect('notification.recipient', 'recipient')
      .orderBy('nl.createdAt', 'DESC');

    const [items, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: items.map((item) => ({
        id: item.id,
        notification: {
          id: item.notification.id,
          type: item.notification.type,
          title: item.notification.title,
          recipient: {
            id: item.notification.recipient.id,
            name: item.notification.recipient.name,
          },
        },
        triggerTime: item.triggerTime,
        triggerResult: item.triggerResult,
        errorMessage: item.errorMessage,
        logFilePath: item.logFilePath,
        createdAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }
}