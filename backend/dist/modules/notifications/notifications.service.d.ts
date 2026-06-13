import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { NotificationLog } from '../../entities/notification-log.entity';
export declare class NotificationService {
    private notificationRepository;
    private notificationLogRepository;
    private readonly logDir;
    constructor(notificationRepository: Repository<Notification>, notificationLogRepository: Repository<NotificationLog>);
    private ensureLogDir;
    sendNotification(type: NotificationType, recipientId: string, title: string, content: string, relatedEntityType?: string, relatedEntityId?: string): Promise<void>;
    private triggerNotification;
    private logNotification;
    findAll(page?: number, pageSize?: number, type?: NotificationType, isRead?: boolean): Promise<{
        items: {
            id: string;
            type: NotificationType;
            recipient: {
                id: string;
                name: string;
            };
            title: string;
            content: string;
            relatedEntity: {
                type: string;
                id: string;
            };
            isRead: boolean;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        type: NotificationType;
        recipient: {
            id: string;
            name: string;
        };
        title: string;
        content: string;
        relatedEntity: {
            type: string;
            id: string;
        };
        isRead: boolean;
        createdAt: Date;
    }>;
    markAsRead(id: string): Promise<void>;
    getLogs(page?: number, pageSize?: number): Promise<{
        items: {
            id: string;
            notification: {
                id: string;
                type: NotificationType;
                title: string;
                recipient: {
                    id: string;
                    name: string;
                };
            };
            triggerTime: Date;
            triggerResult: string;
            errorMessage: string;
            logFilePath: string;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
