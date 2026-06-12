import { OperationLog, UserRole, TimelineEvent, Attachment } from '../types';
export declare const logOperation: (entityType: OperationLog["entityType"], entityId: string, action: string, description: string, operatorId: string, operatorName: string, operatorRole: UserRole, oldStatus?: string, newStatus?: string, details?: Record<string, unknown>) => Promise<void>;
export declare const getOperationLogs: (entityType: OperationLog["entityType"], entityId: string) => Promise<OperationLog[]>;
export declare const generateTimeline: (logs: OperationLog[], exceptions?: any[], attachments?: Attachment[]) => TimelineEvent[];
export declare const parseAttachmentJson: (json: string | null) => Attachment[];
export declare const serializeAttachmentJson: (attachments: Attachment[]) => string;
