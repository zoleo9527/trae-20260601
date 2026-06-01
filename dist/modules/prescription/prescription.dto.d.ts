import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrescriptionStatus } from './prescription.enum';
export declare class MedicineDto {
    name: string;
    specification: string;
    dosage: string;
    frequency: string;
    quantity: number;
    unit: string;
    remark?: string;
}
export declare class CreatePrescriptionDto {
    prescriptionNo: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    doctorName: string;
    department: string;
    diagnosis: string;
    medicines: MedicineDto[];
    remark?: string;
    storeId: string;
    storeName: string;
}
export declare class UpdatePrescriptionDto {
    patientName?: string;
    patientAge?: number;
    patientGender?: string;
    doctorName?: string;
    department?: string;
    diagnosis?: string;
    medicines?: MedicineDto[];
    remark?: string;
}
export declare class SubmitPrescriptionDto {
    remark?: string;
}
export declare class ReviewPrescriptionDto {
    remark?: string;
}
export declare class ApprovePrescriptionDto {
    reviewRemark?: string;
}
export declare class RejectPrescriptionDto {
    rejectReason: string;
    reviewRemark?: string;
}
export declare class SupplementPrescriptionDto {
    supplementRemark: string;
}
export declare class VoidPrescriptionDto {
    remark: string;
}
export declare class PrescriptionQueryDto extends PaginationQueryDto {
    currentStatus?: PrescriptionStatus;
    storeId?: string;
    patientName?: string;
    startTime?: string;
    endTime?: string;
    prescriptionNo?: string;
}
