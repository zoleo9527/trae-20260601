import { User, Application, ApplicationStatus, SupplementNotice, FeeItem } from '../types';
export interface CreateApplicationParams {
    applicantName: string;
    applicantIdNo: string;
    notaryType: string;
    appointmentNo?: string;
}
export interface SubmitMaterialParams {
    applicationId: string;
    materials: Array<{
        name: string;
        isOriginal: boolean;
        remark?: string;
    }>;
}
export interface IssueSupplementNoticeParams {
    applicationId: string;
    reason: string;
    requiredMaterials: string[];
    deadline: Date;
}
export interface RespondSupplementNoticeParams {
    noticeId: string;
    responseRemark?: string;
}
export declare class ApplicationService {
    static createApplication(params: CreateApplicationParams, operator: User): Application;
    static submitMaterials(params: SubmitMaterialParams, operator: User): Application | {
        error: string[];
    };
    static reviewAndSetPayment(params: {
        applicationId: string;
        feeItems: FeeItem[];
    }, operator: User): Application | {
        error: string[];
    };
    static issueSupplementNotice(params: IssueSupplementNoticeParams, operator: User): SupplementNotice | {
        error: string[];
    };
    static getApplicationById(id: string): Application | undefined;
    static getApplicationByNo(applicationNo: string): Application | undefined;
    static getAllApplications(): Application[];
    static getApplicationsByStatus(status: ApplicationStatus): Application[];
    static getStuckApplications(): Application[];
    private static generateApplicationNo;
}
