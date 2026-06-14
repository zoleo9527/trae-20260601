import { User, OperationLog, ApplicationStatus } from '../types';
export interface LogOperationParams {
    applicationId: string;
    operator: User;
    operation: string;
    previousStatus?: ApplicationStatus;
    newStatus?: ApplicationStatus;
    remark?: string;
}
export declare class OperationLogService {
    static logOperation(params: LogOperationParams): OperationLog;
    static getApplicationLogs(applicationId: string): OperationLog[];
    static formatStatusChange(prev?: ApplicationStatus, next?: ApplicationStatus): string;
}
