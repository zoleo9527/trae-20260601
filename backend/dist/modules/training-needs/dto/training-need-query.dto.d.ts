import { TrainingNeedStatus, Urgency } from '../../entities/training-need.entity';
export declare class TrainingNeedQueryDto {
    page?: number;
    pageSize?: number;
    status?: TrainingNeedStatus;
    department?: string;
    urgency?: Urgency;
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
}
