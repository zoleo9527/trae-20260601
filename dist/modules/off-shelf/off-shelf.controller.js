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
exports.OffShelfController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const off_shelf_service_1 = require("./off-shelf.service");
const off_shelf_order_entity_1 = require("./entities/off-shelf-order.entity");
const create_off_shelf_order_dto_1 = require("./dto/create-off-shelf-order.dto");
const submit_off_shelf_dto_1 = require("./dto/submit-off-shelf.dto");
const confirm_off_shelf_dto_1 = require("./dto/confirm-off-shelf.dto");
const reject_off_shelf_dto_1 = require("./dto/reject-off-shelf.dto");
const cancel_off_shelf_dto_1 = require("./dto/cancel-off-shelf.dto");
const query_off_shelf_dto_1 = require("./dto/query-off-shelf.dto");
const request_context_decorator_1 = require("../../common/decorators/request-context.decorator");
const response_dto_1 = require("../../common/dto/response.dto");
let OffShelfController = class OffShelfController {
    constructor(offShelfService) {
        this.offShelfService = offShelfService;
    }
    async create(dto, ctx) {
        const data = await this.offShelfService.create(dto, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
    async findAll(query) {
        const data = await this.offShelfService.findAll(query);
        return response_dto_1.ApiResponse.success(data);
    }
    async getAllowedActions(id, ctx) {
        const data = await this.offShelfService.getAllowedActions(id, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
    async findOne(id) {
        const data = await this.offShelfService.findOne(id);
        return response_dto_1.ApiResponse.success(data);
    }
    async update(id, dto, ctx) {
        const data = await this.offShelfService.update(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
    async remove(id) {
        await this.offShelfService.remove(id);
        return response_dto_1.ApiResponse.success(null);
    }
    async submit(id, dto, ctx) {
        const data = await this.offShelfService.submit(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
    async confirm(id, dto, ctx) {
        const data = await this.offShelfService.confirm(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
    async reject(id, dto, ctx) {
        const data = await this.offShelfService.reject(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
    async cancel(id, dto, ctx) {
        const data = await this.offShelfService.cancel(id, dto, ctx);
        return response_dto_1.ApiResponse.success(data);
    }
};
exports.OffShelfController = OffShelfController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建下架单' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_off_shelf_order_dto_1.CreateOffShelfOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询下架单' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_off_shelf_dto_1.QueryOffShelfDto]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/allowed-actions'),
    (0, swagger_1.ApiOperation)({ summary: '获取可执行操作' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: [String] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "getAllowedActions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取下架单详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新下架单' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_off_shelf_order_dto_1.CreateOffShelfOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除下架单' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, swagger_1.ApiOperation)({ summary: '提交下架单' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '提交成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_off_shelf_dto_1.SubmitOffShelfDto, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, swagger_1.ApiOperation)({ summary: '复核通过下架单' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '复核通过成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, confirm_off_shelf_dto_1.ConfirmOffShelfDto, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: '复核拒绝下架单' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '复核拒绝成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_off_shelf_dto_1.RejectOffShelfDto, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: '取消下架单' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '下架单ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '取消成功', type: off_shelf_order_entity_1.OffShelfOrder }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_off_shelf_dto_1.CancelOffShelfDto, Object]),
    __metadata("design:returntype", Promise)
], OffShelfController.prototype, "cancel", null);
exports.OffShelfController = OffShelfController = __decorate([
    (0, swagger_1.ApiTags)('下架确认管理'),
    (0, common_1.Controller)('off-shelf'),
    __metadata("design:paramtypes", [off_shelf_service_1.OffShelfService])
], OffShelfController);
//# sourceMappingURL=off-shelf.controller.js.map