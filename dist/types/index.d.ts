export type UserRole = 'WINDOW_STAFF' | 'NOTARY' | 'ARCHIVIST';
export interface User {
    id: string;
    name: string;
    role: UserRole;
    employeeId: string;
}
export type ApplicationStatus = 'PENDING_MATERIALS' | 'MATERIALS_SUBMITTED' | 'PENDING_PAYMENT' | 'PAYMENT_REGISTERED' | 'PENDING_CERTIFICATE_ARRANGEMENT' | 'CERTIFICATE_ARRANGED' | 'COMPLETED' | 'REJECTED' | 'SUPPLEMENT_NEEDED';
export type PaymentStatus = 'UNPAID' | 'PENDING_REGISTRATION' | 'REGISTERED' | 'CONFIRMED';
export type CertificateStatus = 'NOT_ARRANGED' | 'ARRANGEMENT_PENDING' | 'ARRANGED' | 'ISSUED';
export interface Application {
    id: string;
    applicationNo: string;
    applicantName: string;
    applicantIdNo: string;
    notaryType: string;
    appointmentNo?: string;
    status: ApplicationStatus;
    materials: MaterialRecord[];
    supplementNotices: SupplementNotice[];
    payment: PaymentRecord;
    certificate: CertificateRecord;
    createdAt: Date;
    updatedAt: Date;
}
export interface MaterialRecord {
    id: string;
    name: string;
    submittedBy: string;
    submittedAt: Date;
    isOriginal: boolean;
    remark?: string;
}
export interface SupplementNotice {
    id: string;
    applicationId: string;
    issuedBy: string;
    issuedAt: Date;
    reason: string;
    requiredMaterials: string[];
    deadline: Date;
    respondedAt?: Date;
    responseRemark?: string;
    isCompleted: boolean;
}
export interface PaymentRecord {
    id: string;
    applicationId: string;
    amount: number;
    feeItems: FeeItem[];
    status: PaymentStatus;
    paymentMethod?: string;
    transactionNo?: string;
    registeredBy?: string;
    registeredAt?: Date;
    confirmedBy?: string;
    confirmedAt?: Date;
    remark?: string;
}
export interface FeeItem {
    name: string;
    amount: number;
    quantity: number;
}
export interface CertificateRecord {
    id: string;
    applicationId: string;
    status: CertificateStatus;
    certificateNo?: string;
    arrangedBy?: string;
    arrangedAt?: Date;
    scheduledPickupDate?: Date;
    issuedBy?: string;
    issuedAt?: Date;
    pickupBy?: string;
    pickupIdNo?: string;
    remark?: string;
}
export interface OperationLog {
    id: string;
    applicationId: string;
    operatorId: string;
    operatorName: string;
    operatorRole: UserRole;
    operation: string;
    previousStatus?: string;
    newStatus?: string;
    remark?: string;
    timestamp: Date;
}
