import { Repository } from 'typeorm';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { RequestContext } from '../../common/decorators/request-context.decorator';
import { Prescription } from './prescription.entity';
import { PrescriptionAction } from './prescription.enum';
import { PrescriptionStateMachine } from './prescription.state-machine';
import { CreatePrescriptionDto, UpdatePrescriptionDto, SubmitPrescriptionDto, ReviewPrescriptionDto, ApprovePrescriptionDto, RejectPrescriptionDto, SupplementPrescriptionDto, VoidPrescriptionDto, PrescriptionQueryDto } from './prescription.dto';
export declare class PrescriptionService {
    private readonly prescriptionRepository;
    private readonly stateMachine;
    constructor(prescriptionRepository: Repository<Prescription>, stateMachine: PrescriptionStateMachine);
    create(dto: CreatePrescriptionDto): Promise<Prescription>;
    findAll(query: PrescriptionQueryDto): Promise<PaginatedResult<Prescription>>;
    findOne(id: string): Promise<Prescription>;
    update(id: string, dto: UpdatePrescriptionDto): Promise<Prescription>;
    remove(id: string): Promise<void>;
    submit(id: string, dto: SubmitPrescriptionDto, ctx: RequestContext): Promise<Prescription>;
    review(id: string, dto: ReviewPrescriptionDto, ctx: RequestContext): Promise<Prescription>;
    approve(id: string, dto: ApprovePrescriptionDto, ctx: RequestContext): Promise<Prescription>;
    reject(id: string, dto: RejectPrescriptionDto, ctx: RequestContext): Promise<Prescription>;
    supplement(id: string, dto: SupplementPrescriptionDto, ctx: RequestContext): Promise<Prescription>;
    void(id: string, dto: VoidPrescriptionDto, ctx: RequestContext): Promise<Prescription>;
    getAllowedActions(id: string, ctx: RequestContext): Promise<PrescriptionAction[]>;
    private addAuditLog;
}
