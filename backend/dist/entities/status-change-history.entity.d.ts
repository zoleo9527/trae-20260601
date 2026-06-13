import { User } from './user.entity';
export declare enum EntityType {
    TRAINING_NEED = "training_need",
    COURSE_PROJECT = "course_project",
    STUDENT = "student"
}
export declare class StatusChangeHistory {
    id: string;
    entityType: EntityType;
    entityId: string;
    fromStatus: string;
    toStatus: string;
    changedById: string;
    changedBy: User;
    reason: string;
    remarks: string;
    createdAt: Date;
}
