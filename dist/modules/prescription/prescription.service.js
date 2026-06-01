"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_exception_1 = require("../../common/exceptions/business.exception");
const error_codes_1 = require("../../common/error-codes");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const prescription_entity_1 = require("./prescription.entity");
const prescription_enum_1 = require("./prescription.enum");
const prescription_state_machine_1 = require("./prescription.state-machine");
let PrescriptionService = class PrescriptionService {
    constructor(prescriptionRepository, stateMachine) {
        this.prescriptionRepository = prescriptionRepository;
        this.stateMachine = stateMachine;
    }
    async create(dto) {
        const existing = await this.prescriptionRepository.findOne({
            where: { prescriptionNo: dto.prescriptionNo },
        });
        if (existing) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.PRESCRIPTION_ALREADY_EXISTS, `处方编号 ${dto.prescriptionNo} 已存在`);
        }
        const prescription = this.prescriptionRepository.create({
            ...dto,
            currentStatus: prescription_enum_1.PrescriptionStatus.DRAFT,
            auditLogs: [],
        });
        return this.prescriptionRepository.save(prescription);
    }
    async findAll(query) {
        const { page, pageSize, sortBy, sortOrder, currentStatus, storeId, patientName, startTime, endTime, prescriptionNo } = query;
        const where = {};
        if (currentStatus) {
            where.currentStatus = currentStatus;
        }
        if (storeId) {
            where.storeId = storeId;
        }
        if (patientName) {
            where.patientName = (0, typeorm_2.Like)(`%${patientName}%`);
        }
        if (prescriptionNo) {
            where.prescriptionNo = (0, typeorm_2.Like)(`%${prescriptionNo}%`);
        }
        const qb = this.prescriptionRepository.createQueryBuilder('prescription');
        qb.where(where);
        if (startTime && endTime) {
            qb.andWhere('prescription.createdAt BETWEEN :startTime AND :endTime', { startTime, endTime });
        }
        else if (startTime) {
            qb.andWhere('prescription.createdAt >= :startTime', { startTime });
        }
        else if (endTime) {
            qb.andWhere('prescription.createdAt <= :endTime', { endTime });
        }
        const orderField = sortBy || 'createdAt';
        qb.orderBy(`prescription.${orderField}`, sortOrder || 'DESC');
        const skip = (page - 1) * pageSize;
        qb.skip(skip).take(pageSize);
        const [items, total] = await qb.getManyAndCount();
        return (0, pagination_dto_1.createPaginatedResult)(items, total, page, pageSize);
    }
    async findOne(id) {
        const prescription = await this.prescriptionRepository.findOne({ where: { id } });
        if (!prescription) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.PRESCRIPTION_NOT_FOUND);
        }
        return prescription;
    }
    async update(id, dto) {
        const prescription = await this.findOne(id);
        if (prescription.currentStatus !== prescription_enum_1.PrescriptionStatus.DRAFT) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.PRESCRIPTION_INVALID_STATE, '仅草稿状态的处方可以编辑', { currentStatus: prescription.currentStatus });
        }
        Object.assign(prescription, dto);
        return this.prescriptionRepository.save(prescription);
    }
    async remove(id) {
        const prescription = await this.findOne(id);
        if (prescription.currentStatus !== prescription_enum_1.PrescriptionStatus.DRAFT) {
            throw new business_exception_1.BusinessException(error_codes_1.ErrorCode.PRESCRIPTION_INVALID_STATE, '仅草稿状态的处方可以删除', { currentStatus: prescription.currentStatus });
        }
        await this.prescriptionRepository.remove(prescription);
    }
    async submit(id, dto, ctx) {
        const prescription = await this.findOne(id);
        const action = prescription_enum_1.PrescriptionAction.SUBMIT;
        this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);
        const beforeState = prescription.currentStatus;
        const nextState = this.stateMachine.getNextState(beforeState, action);
        this.addAuditLog(prescription, {
            beforeState,
            afterState: nextState,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            action,
            remark: dto.remark,
        });
        prescription.currentStatus = nextState;
        prescription.submitterId = ctx.userId;
        prescription.submitterName = ctx.userName;
        prescription.submitTime = new Date();
        return this.prescriptionRepository.save(prescription);
    }
    async review(id, dto, ctx) {
        const prescription = await this.findOne(id);
        const action = prescription_enum_1.PrescriptionAction.REVIEW;
        this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);
        const beforeState = prescription.currentStatus;
        const nextState = this.stateMachine.getNextState(beforeState, action);
        this.addAuditLog(prescription, {
            beforeState,
            afterState: nextState,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            action,
            remark: dto.remark,
        });
        prescription.currentStatus = nextState;
        prescription.reviewerId = ctx.userId;
        prescription.reviewerName = ctx.userName;
        prescription.reviewTime = new Date();
        return this.prescriptionRepository.save(prescription);
    }
    async approve(id, dto, ctx) {
        const prescription = await this.findOne(id);
        const action = prescription_enum_1.PrescriptionAction.APPROVE;
        this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);
        const beforeState = prescription.currentStatus;
        const nextState = this.stateMachine.getNextState(beforeState, action);
        this.addAuditLog(prescription, {
            beforeState,
            afterState: nextState,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            action,
            remark: dto.reviewRemark,
        });
        prescription.currentStatus = nextState;
        prescription.reviewerId = ctx.userId;
        prescription.reviewerName = ctx.userName;
        prescription.reviewTime = new Date();
        prescription.reviewRemark = dto.reviewRemark;
        return this.prescriptionRepository.save(prescription);
    }
    async reject(id, dto, ctx) {
        const prescription = await this.findOne(id);
        const action = prescription_enum_1.PrescriptionAction.REJECT;
        this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);
        const beforeState = prescription.currentStatus;
        const nextState = this.stateMachine.getNextState(beforeState, action);
        this.addAuditLog(prescription, {
            beforeState,
            afterState: nextState,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            action,
            remark: `${dto.rejectReason}${dto.reviewRemark ? ` | ${dto.reviewRemark}` : ''}`,
        });
        prescription.currentStatus = nextState;
        prescription.reviewerId = ctx.userId;
        prescription.reviewerName = ctx.userName;
        prescription.reviewTime = new Date();
        prescription.rejectReason = dto.rejectReason;
        prescription.reviewRemark = dto.reviewRemark;
        return this.prescriptionRepository.save(prescription);
    }
    async supplement(id, dto, ctx) {
        const prescription = await this.findOne(id);
        const action = prescription_enum_1.PrescriptionAction.SUPPLEMENT;
        this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);
        const beforeState = prescription.currentStatus;
        const nextState = this.stateMachine.getNextState(beforeState, action);
        this.addAuditLog(prescription, {
            beforeState,
            afterState: nextState,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            action,
            remark: dto.supplementRemark,
        });
        prescription.currentStatus = nextState;
        prescription.supplementRemark = dto.supplementRemark;
        prescription.supplementTime = new Date();
        return this.prescriptionRepository.save(prescription);
    }
    async void(id, dto, ctx) {
        const prescription = await this.findOne(id);
        const action = prescription_enum_1.PrescriptionAction.VOID;
        this.stateMachine.validateTransition(prescription.currentStatus, action, ctx.userRole);
        const beforeState = prescription.currentStatus;
        const nextState = this.stateMachine.getNextState(beforeState, action);
        this.addAuditLog(prescription, {
            beforeState,
            afterState: nextState,
            operatorId: ctx.userId,
            operatorName: ctx.userName,
            action,
            remark: dto.remark,
        });
        prescription.currentStatus = nextState;
        return this.prescriptionRepository.save(prescription);
    }
    async getAllowedActions(id, ctx) {
        const prescription = await this.findOne(id);
        return this.stateMachine.getAllowedActions(prescription.currentStatus, ctx.userRole);
    }
    addAuditLog(prescription, log) {
        const auditLog = {
            ...log,
            timestamp: new Date(),
        };
        prescription.auditLogs = [...prescription.auditLogs, auditLog];
    }
};
exports.PrescriptionService = PrescriptionService;
exports.PrescriptionService = PrescriptionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prescription_entity_1.Prescription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        prescription_state_machine_1.PrescriptionStateMachine])
], PrescriptionService);
//# sourceMappingURL=prescription.service.js.map