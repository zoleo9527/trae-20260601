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
exports.TransferController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transfer_service_1 = require("./transfer.service");
const dto_1 = require("./dto");
const transfer_order_entity_1 = require("./entities/transfer-order.entity");
const request_context_decorator_1 = require("../../common/decorators/request-context.decorator");
const response_dto_1 = require("../../common/dto/response.dto");
let TransferController = class TransferController {
    constructor(transferService) {
        this.transferService = transferService;
    }
    async create(createTransferDto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.create(createTransferDto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async findAll(query, ctx) {
        const data = await this.transferService.findAll(query);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async getStatistics(ctx) {
        const data = await this.transferService.getStatistics();
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async batchApprove(dto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.batchApprove(dto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async getAllowedActions(id, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.getAllowedActions(id, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async findOne(id, ctx) {
        const data = await this.transferService.findOne(id);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async update(id, updateTransferDto, ctx) {
        const data = await this.transferService.update(id, updateTransferDto);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    remove(id) {
        return this.transferService.remove(id);
    }
    async submit(id, dto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.submit(id, dto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async approve(id, dto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.approve(id, dto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async reject(id, dto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.reject(id, dto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async complete(id, dto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.complete(id, dto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async cancel(id, dto, ctx) {
        const operator = {
            id: ctx.userId,
            name: ctx.userName,
            role: ctx.userRole,
        };
        const data = await this.transferService.cancel(id, dto, operator);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
};
exports.TransferController = TransferController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建调拨单' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTransferDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询调拨单列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryTransferDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: '按状态统计调拨单数量' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '统计成功' }),
    __param(0, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Post)('batch-approve'),
    (0, swagger_1.ApiOperation)({ summary: '批量审批（仅经理）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '批量审批完成', type: dto_1.BatchApproveResultDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BatchApproveDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "batchApprove", null);
__decorate([
    (0, common_1.Get)(':id/allowed-actions'),
    (0, swagger_1.ApiOperation)({ summary: '获取当前状态允许的操作' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: [String] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "getAllowedActions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取调拨单详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新调拨单（仅草稿状态）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTransferDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除调拨单（仅草稿状态）' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, swagger_1.ApiOperation)({ summary: '提交调拨单' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '提交成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TransferActionDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, swagger_1.ApiOperation)({ summary: '审批通过（仅经理）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '审批成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TransferActionDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: '审批拒绝（仅经理）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '拒绝成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TransferActionDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, swagger_1.ApiOperation)({ summary: '完成调拨（更新库存）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '完成成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TransferActionDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: '取消调拨单' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '取消成功', type: transfer_order_entity_1.TransferOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TransferActionDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "cancel", null);
exports.TransferController = TransferController = __decorate([
    (0, swagger_1.ApiTags)('调拨管理'),
    (0, common_1.Controller)('transfers'),
    __metadata("design:paramtypes", [transfer_service_1.TransferService])
], TransferController);
//# sourceMappingURL=transfer.controller.js.map