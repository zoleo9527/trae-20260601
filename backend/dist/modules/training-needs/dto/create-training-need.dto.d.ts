import { Urgency } from '../../entities/training-need.entity';
export declare class CreateTrainingNeedDto {
    title: string;
    description?: string;
    department: string;
    expectedDate: Date;
    participantCount: number;
    budget?: number;
    urgency?: Urgency;
    attachments?: string[];
}
