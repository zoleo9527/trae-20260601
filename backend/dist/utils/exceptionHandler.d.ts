import { ExceptionRecord, ExceptionType, UserRole, Project } from '../types';
export declare const createException: (projectId: string, projectNo: string, projectName: string, type: ExceptionType, title: string, description: string, triggeredBy: string, triggerSource?: "system" | "manual", triggerCondition?: string, operatorId?: string, operatorName?: string, operatorRole?: UserRole) => Promise<ExceptionRecord>;
export declare const sendExceptionNotifications: (exception: ExceptionRecord) => Promise<void>;
export declare const handleException: (exceptionId: string, handlerId: string, handlerName: string, handlerRole: UserRole, resolution: string) => Promise<ExceptionRecord | null>;
export declare const rejectException: (exceptionId: string, handlerId: string, handlerName: string, handlerRole: UserRole, rejectReason: string) => Promise<ExceptionRecord | null>;
export declare const checkAndTriggerExceptions: (project: Project, arrangement: any, signinRecords: any[], autoCheckType: ExceptionType, checkCondition: string) => Promise<ExceptionRecord | null>;
export declare const getProjectExceptions: (projectId: string) => Promise<ExceptionRecord[]>;
