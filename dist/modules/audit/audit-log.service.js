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
var AuditLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./audit-log.entity");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let AuditLogService = AuditLogService_1 = class AuditLogService {
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
        AuditLogService_1.instance = this;
    }
    async log(dto) {
        const auditLog = this.auditLogRepository.create({
            module: dto.module,
            action: dto.action,
            entityId: dto.entityId,
            beforeState: dto.beforeState,
            afterState: dto.afterState,
            remark: dto.remark,
            operatorId: dto.operatorId,
            operatorName: dto.operatorName,
            operatorRole: dto.operatorRole,
            storeId: dto.storeId,
            storeName: dto.storeName,
            requestId: dto.requestId,
            success: dto.success ?? true,
            requestData: dto.requestData,
            responseData: dto.responseData,
        });
        return this.auditLogRepository.save(auditLog);
    }
    async query(dto) {
        const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'DESC', module, action, operatorId, storeId, startTime, endTime, } = dto;
        const where = {};
        if (module) {
            where.module = module;
        }
        if (action) {
            where.action = action;
        }
        if (operatorId) {
            where.operatorId = operatorId;
        }
        if (storeId) {
            where.storeId = storeId;
        }
        if (startTime && endTime) {
            where.createdAt = (0, typeorm_2.Between)(new Date(startTime), new Date(endTime));
        }
        else if (startTime) {
            where.createdAt = (0, typeorm_2.Between)(new Date(startTime), new Date());
        }
        else if (endTime) {
            where.createdAt = (0, typeorm_2.Between)(new Date('1970-01-01'), new Date(endTime));
        }
        const [items, total] = await this.auditLogRepository.findAndCount({
            where,
            order: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return (0, pagination_dto_1.createPaginatedResult)(items, total, page, pageSize);
    }
    async findById(id) {
        const auditLog = await this.auditLogRepository.findOne({
            where: { id },
        });
        if (!auditLog) {
            throw new common_1.NotFoundException('审计日志不存在');
        }
        return auditLog;
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = AuditLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map