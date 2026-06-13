import { Notification } from './notification.entity';
export declare class NotificationLog {
    id: string;
    notificationId: string;
    notification: Notification;
    triggerTime: Date;
    triggerResult: string;
    errorMessage: string;
    logFilePath: string;
    createdAt: Date;
}
