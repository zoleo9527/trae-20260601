import { User } from './user.entity';
import { TrainingNeedRemark } from './training-need-remark.entity';
export declare enum TrainingNeedStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    TRANSFERRED = "transferred"
}
export declare enum Urgency {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare class TrainingNeed {
    id: string;
    title: string;
    description: string;
    department: string;
    submitterId: string;
    submitter: User;
    currentHandlerId: string;
    currentHandler: User;
    expectedDate: Date;
    participantCount: number;
    budget: number;
    urgency: Urgency;
    status: TrainingNeedStatus;
    attachments: string;
    remarks: TrainingNeedRemark[];
    createdAt: Date;
    updatedAt: Date;
}
