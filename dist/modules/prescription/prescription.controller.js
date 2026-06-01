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
exports.PrescriptionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const request_context_decorator_1 = require("../../common/decorators/request-context.decorator");
const response_dto_1 = require("../../common/dto/response.dto");
const prescription_entity_1 = require("./prescription.entity");
const prescription_service_1 = require("./prescription.service");
const prescription_dto_1 = require("./prescription.dto");
let PrescriptionController = class PrescriptionController {
    constructor(prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    async create(dto, ctx) {
        const data = await this.prescriptionService.create(dto);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async findAll(query, ctx) {
        const data = await this.prescriptionService.findAll(query);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async getAllowedActions(id, ctx) {
        const data = await this.prescriptionService.getAllowedActions(id, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async findOne(id, ctx) {
        const data = await this.prescriptionService.findOne(id);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async update(id, dto, ctx) {
        const data = await this.prescriptionService.update(id, dto);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async remove(id, ctx) {
        await this.prescriptionService.remove(id);
        return response_dto_1.ApiResponse.success(null, ctx.requestId);
    }
    async submit(id, dto, ctx) {
        const data = await this.prescriptionService.submit(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async review(id, dto, ctx) {
        const data = await this.prescriptionService.review(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async approve(id, dto, ctx) {
        const data = await this.prescriptionService.approve(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async reject(id, dto, ctx) {
        const data = await this.prescriptionService.reject(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async supplement(id, dto, ctx) {
        const data = await this.prescriptionService.supplement(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async void(id, dto, ctx) {
        const data = await this.prescriptionService.void(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
};
exports.PrescriptionController = PrescriptionController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建处方' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prescription_dto_1.CreatePrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询处方列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prescription_dto_1.PrescriptionQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/allowed-actions'),
    (0, swagger_1.ApiOperation)({ summary: '获取当前处方可执行操作' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: [String] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "getAllowedActions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取处方详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新处方（仅草稿状态）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.UpdatePrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除处方（仅草稿状态）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, swagger_1.ApiOperation)({ summary: '提交处方复核' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '提交成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.SubmitPrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    (0, swagger_1.ApiOperation)({ summary: '开始审核处方' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '审核中', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.ReviewPrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "review", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: '审核通过处方' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '通过成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.ApprovePrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: '审核拒绝处方' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '拒绝成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.RejectPrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/supplement'),
    (0, swagger_1.ApiOperation)({ summary: '补充处方说明' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '补充成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.SupplementPrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "supplement", null);
__decorate([
    (0, common_1.Post)(':id/void'),
    (0, swagger_1.ApiOperation)({ summary: '作废处方' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '处方ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '作废成功', type: prescription_entity_1.Prescription }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prescription_dto_1.VoidPrescriptionDto, Object]),
    __metadata("design:returntype", Promise)
], PrescriptionController.prototype, "void", null);
exports.PrescriptionController = PrescriptionController = __decorate([
    (0, swagger_1.ApiTags)('处方管理'),
    (0, common_1.Controller)('prescriptions'),
    __metadata("design:paramtypes", [prescription_service_1.PrescriptionService])
], PrescriptionController);
//# sourceMappingURL=prescription.controller.js.map