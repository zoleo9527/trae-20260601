import { RequestContext } from '../../common/decorators/request-context.decorator';
import { ApiResponse as ApiResponseDto } from '../../common/dto/response.dto';
import { Prescription } from './prescription.entity';
import { PrescriptionAction } from './prescription.enum';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto, SubmitPrescriptionDto, ReviewPrescriptionDto, ApprovePrescriptionDto, RejectPrescriptionDto, SupplementPrescriptionDto, VoidPrescriptionDto, PrescriptionQueryDto } from './prescription.dto';
export declare class PrescriptionController {
    private readonly prescriptionService;
    constructor(prescriptionService: PrescriptionService);
    create(dto: CreatePrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    findAll(query: PrescriptionQueryDto, ctx: RequestContext): Promise<ApiResponseDto<any>>;
    getAllowedActions(id: string, ctx: RequestContext): Promise<ApiResponseDto<PrescriptionAction[]>>;
    findOne(id: string, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    update(id: string, dto: UpdatePrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    remove(id: string, ctx: RequestContext): Promise<ApiResponseDto<null>>;
    submit(id: string, dto: SubmitPrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    review(id: string, dto: ReviewPrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    approve(id: string, dto: ApprovePrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    reject(id: string, dto: RejectPrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    supplement(id: string, dto: SupplementPrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
    void(id: string, dto: VoidPrescriptionDto, ctx: RequestContext): Promise<ApiResponseDto<Prescription>>;
}
