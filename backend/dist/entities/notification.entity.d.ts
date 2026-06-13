import { User } from './user.entity';
export declare enum NotificationType {
    TRAINING_NEED_APPROVED = "training_need_approved",
    TRAINING_NEED_REJECTED = "training_need_rejected",
    TRAINING_NEED_TRANSFERRED = "training_need_transferred",
    COURSE_PROJECT_APPROVED = "course_project_approved",
    COURSE_PROJECT_REJECTED = "course_project_rejected",
    COURSE_REMINDER = "course_reminder",
    ASSIGNMENT_REMINDER = "assignment_reminder",
    CERTIFICATE_ISSUED = "certificate_issued"
}
export declare class Notification {
    id: string;
    type: NotificationType;
    recipientId: string;
    recipient: User;
    title: string;
    content: string;
    relatedEntityType: string;
    relatedEntityId: string;
    isRead: boolean;
    createdAt: Date;
}
