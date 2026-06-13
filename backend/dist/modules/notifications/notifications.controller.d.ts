import { NotificationService } from './notifications.service';
import { NotificationType } from '../../entities/notification.entity';
export declare class NotificationsController {
    private notificationService;
    constructor(notificationService: NotificationService);
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
    markAsRead(id: string): Promise<{
        message: string;
    }>;
}
