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
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_log_service_1 = require("./audit-log.service");
const audit_log_dto_1 = require("./audit-log.dto");
const request_context_decorator_1 = require("../../common/decorators/request-context.decorator");
const response_dto_1 = require("../../common/dto/response.dto");
let AuditLogController = class AuditLogController {
    constructor(auditLogService) {
        this.auditLogService = auditLogService;
    }
    async query(dto, ctx) {
        const data = await this.auditLogService.query(dto);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
    async findById(id, ctx) {
        const data = await this.auditLogService.findById(id);
        return response_dto_1.ApiResponse.success(data, ctx.requestId);
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询审计日志' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '分页查询成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [audit_log_dto_1.QueryAuditLogDto, Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "query", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取审计日志详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '日志不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "findById", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, swagger_1.ApiTags)('审计日志'),
    (0, common_1.Controller)('audit/logs'),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map