import { User, Application, CertificateRecord, OperationLog } from '../types';
export interface ArrangeCertificateParams {
    applicationId: string;
    scheduledPickupDate: Date;
    certificateNo?: string;
    remark?: string;
}
export interface IssueCertificateParams {
    applicationId: string;
    pickupBy: string;
    pickupIdNo: string;
    remark?: string;
}
export interface CertificateValidationResult {
    valid: boolean;
    errors: string[];
}
export interface CertificateHistoryItem {
    timestamp: Date;
    operator: string;
    operatorRole: string;
    operation: string;
    statusChange: string;
    remark?: string;
}
export declare class CertificateService {
    static validateCertificateArrangement(app: Application | undefined, params: ArrangeCertificateParams): CertificateValidationResult;
    static validateCertificateIssuance(app: Application | undefined): CertificateValidationResult;
    static arrangeCertificate(params: ArrangeCertificateParams, operator: User): Application | {
        error: string[];
    };
    static issueCertificate(params: IssueCertificateParams, operator: User): Application | {
        error: string[];
    };
    static getCertificateRecord(applicationId: string): CertificateRecord | undefined;
    static getCertificateHistory(applicationId: string): CertificateHistoryItem[];
    static getApplicationsPendingArrangement(): Application[];
    static getApplicationsPendingIssuance(): Application[];
    static getCompletedApplications(): Application[];
    static getStuckCertificateRecords(): Application[];
    static reviewCertificateProcess(applicationId: string): {
        application: Application;
        payment: {
            registeredBy?: string;
            registeredAt?: Date;
            confirmedBy?: string;
            confirmedAt?: Date;
        };
        certificate: {
            arrangedBy?: string;
            arrangedAt?: Date;
            issuedBy?: string;
            issuedAt?: Date;
        };
        history: OperationLog[];
        responsibilityChain: Array<{
            step: string;
            handler: string;
            handlerRole: string;
            timestamp: Date;
            isCompleted: boolean;
        }>;
    } | {
        error: string[];
    };
    private static generateCertificateNo;
}
