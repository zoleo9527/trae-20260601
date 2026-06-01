export declare class AuditLog {
    id: string;
    module: string;
    action: string;
    entityId: string;
    beforeState: Record<string, any>;
    afterState: Record<string, any>;
    remark: string;
    operatorId: string;
    operatorName: string;
    operatorRole: string;
    storeId: string;
    storeName: string;
    requestId: string;
    success: boolean;
    requestData: Record<string, any>;
    responseData: Record<string, any>;
    createdAt: Date;
}
