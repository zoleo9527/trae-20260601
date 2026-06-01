export declare class BatchApproveResultItemDto {
    id: string;
    success: boolean;
    code?: string;
    message?: string;
}
export declare class BatchApproveResultDto {
    successCount: number;
    failCount: number;
    results: BatchApproveResultItemDto[];
}
