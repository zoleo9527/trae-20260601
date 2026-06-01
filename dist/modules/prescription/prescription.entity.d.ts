import { PrescriptionStatus } from './prescription.enum';
export interface Medicine {
    name: string;
    specification: string;
    dosage: string;
    frequency: string;
    quantity: number;
    unit: string;
    remark?: string;
}
export interface AuditLog {
    beforeState: PrescriptionStatus;
    afterState: PrescriptionStatus;
    operatorId: string;
    operatorName: string;
    action: string;
    remark?: string;
    timestamp: Date;
}
export declare class Prescription {
    id: string;
    prescriptionNo: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    doctorName: string;
    department: string;
    diagnosis: string;
    medicines: Medicine[];
    remark?: string;
    currentStatus: PrescriptionStatus;
    submitterId?: string;
    submitterName?: string;
    submitTime?: Date;
    reviewerId?: string;
    reviewerName?: string;
    reviewTime?: Date;
    reviewRemark?: string;
    rejectReason?: string;
    supplementRemark?: string;
    supplementTime?: Date;
    storeId: string;
    storeName: string;
    auditLogs: AuditLog[];
    createdAt: Date;
    updatedAt: Date;
}
