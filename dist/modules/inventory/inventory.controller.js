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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const medicine_inventory_dto_1 = require("./dto/medicine-inventory.dto");
const near_expiry_alert_dto_1 = require("./dto/near-expiry-alert.dto");
const response_dto_1 = require("../../common/dto/response.dto");
const request_context_decorator_1 = require("../../common/decorators/request-context.decorator");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async create(dto, requestId) {
        const data = await this.inventoryService.create(dto);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async findAll(query, requestId) {
        const data = await this.inventoryService.findAll(query);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async findNearExpiry(query, requestId) {
        const data = await this.inventoryService.findNearExpiryMedicines(query.daysToExpiry || 90);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async findAlerts(query, requestId) {
        const data = await this.inventoryService.findAlerts(query);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async findAlertById(id, requestId) {
        const data = await this.inventoryService.findAlertById(id);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async acknowledgeAlert(id, dto, context) {
        const data = await this.inventoryService.acknowledgeAlert(id, dto, context.userId);
        return response_dto_1.ApiResponse.success(data, context.requestId);
    }
    async resolveAlert(id, dto, context) {
        const data = await this.inventoryService.resolveAlert(id, dto, context.userId);
        return response_dto_1.ApiResponse.success(data, context.requestId);
    }
    async generateAlerts(requestId) {
        const data = await this.inventoryService.generateAlerts();
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async findOne(id, requestId) {
        const data = await this.inventoryService.findOne(id);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async update(id, dto, requestId) {
        const data = await this.inventoryService.update(id, dto);
        return response_dto_1.ApiResponse.success(data, requestId);
    }
    async remove(id) {
        await this.inventoryService.remove(id);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建库存记录' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [medicine_inventory_dto_1.CreateMedicineInventoryDto, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询库存' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [medicine_inventory_dto_1.MedicineInventoryQueryDto, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('near-expiry'),
    (0, swagger_1.ApiOperation)({ summary: '查询近效药' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [near_expiry_alert_dto_1.NearExpiryMedicineQueryDto, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findNearExpiry", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({ summary: '分页查询预警' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [near_expiry_alert_dto_1.NearExpiryAlertQueryDto, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAlerts", null);
__decorate([
    (0, common_1.Get)('alerts/:id'),
    (0, swagger_1.ApiOperation)({ summary: '获取预警详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAlertById", null);
__decorate([
    (0, common_1.Post)('alerts/:id/acknowledge'),
    (0, swagger_1.ApiOperation)({ summary: '确认预警' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '确认成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, near_expiry_alert_dto_1.AcknowledgeAlertDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "acknowledgeAlert", null);
__decorate([
    (0, common_1.Post)('alerts/:id/resolve'),
    (0, swagger_1.ApiOperation)({ summary: '解决预警（同时扣减库存）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '解决成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, near_expiry_alert_dto_1.ResolveAlertDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "resolveAlert", null);
__decorate([
    (0, common_1.Post)('generate-alerts'),
    (0, swagger_1.ApiOperation)({ summary: '手工触发生成预警' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '生成成功' }),
    __param(0, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "generateAlerts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取库存详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新库存记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, request_context_decorator_1.CurrentUser)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, medicine_inventory_dto_1.UpdateMedicineInventoryDto, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除库存记录' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "remove", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('库存管理'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map