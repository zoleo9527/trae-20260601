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
exports.KeyTransferController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const key_transfer_service_1 = require("./key-transfer.service");
let KeyTransferController = class KeyTransferController {
    constructor(keyTransferService) {
        this.keyTransferService = keyTransferService;
    }
    initiateTransfer(body, user) {
        return this.keyTransferService.initiateTransfer(body, user.sub, user.name, user.role);
    }
    getByHandover(handoverId) {
        return this.keyTransferService.getByHandover(handoverId);
    }
    findAll(query) {
        const filters = {};
        if (query.propertyId)
            filters.propertyId = query.propertyId;
        if (query.handoverId)
            filters.handoverId = query.handoverId;
        if (query.status)
            filters.status = query.status;
        return this.keyTransferService.findAll(filters);
    }
    findOne(id) {
        return this.keyTransferService.findOne(id);
    }
    confirmReception(id, user) {
        return this.keyTransferService.confirmReception(id, user.sub, user.name, user.role);
    }
    returnKeys(id, body, user) {
        return this.keyTransferService.returnKeys(id, body, user.sub, user.name, user.role);
    }
    getTransferHistory(id) {
        return this.keyTransferService.getTransferHistory(id);
    }
    getTransferTimeline(id) {
        return this.keyTransferService.getTransferTimeline(id);
    }
};
exports.KeyTransferController = KeyTransferController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('consultant'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "initiateTransfer", null);
__decorate([
    (0, common_1.Get)('handover/:handoverId'),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Param)('handoverId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "getByHandover", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/receive'),
    (0, roles_decorator_1.Roles)('operations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "confirmReception", null);
__decorate([
    (0, common_1.Patch)(':id/return'),
    (0, roles_decorator_1.Roles)('operations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "returnKeys", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "getTransferHistory", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KeyTransferController.prototype, "getTransferTimeline", null);
exports.KeyTransferController = KeyTransferController = __decorate([
    (0, common_1.Controller)('key-transfers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [key_transfer_service_1.KeyTransferService])
], KeyTransferController);
//# sourceMappingURL=key-transfer.controller.js.map