import { StatusChangeHistoryService } from './status-history.service';
export declare class StatusHistoryController {
    private statusHistoryService;
    constructor(statusHistoryService: StatusChangeHistoryService);
    getTrainingNeedHistory(id: string): Promise<{
        entityType: string;
        entityId: string;
        totalChanges: number;
        latest: any;
        timeline: {
            step: number;
            fromStatus: any;
            toStatus: any;
            handler: {
                id: any;
                name: any;
            };
            reason: any;
            remarks: any;
            timestamp: any;
            statusLabel: string;
            actionLabel: string;
        }[];
    }>;
    getCourseProjectHistory(id: string): Promise<{
        entityType: string;
        entityId: string;
        totalChanges: number;
        latest: any;
        timeline: {
            step: number;
            fromStatus: any;
            toStatus: any;
            handler: {
                id: any;
                name: any;
            };
            reason: any;
            remarks: any;
            timestamp: any;
            statusLabel: string;
            actionLabel: string;
        }[];
    }>;
    getTrainingNeedLatestChange(id: string): Promise<{
        entityType: string;
        entityId: string;
        latest: import("../../entities/status-change-history.entity").StatusChangeHistory;
    }>;
    getCourseProjectLatestChange(id: string): Promise<{
        entityType: string;
        entityId: string;
        latest: import("../../entities/status-change-history.entity").StatusChangeHistory;
    }>;
    private buildTimeline;
    private getStatusLabel;
    private getActionLabel;
}
