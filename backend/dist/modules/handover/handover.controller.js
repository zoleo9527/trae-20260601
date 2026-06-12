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
exports.HandoverController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const handover_service_1 = require("./handover.service");
let HandoverController = class HandoverController {
    constructor(handoverService) {
        this.handoverService = handoverService;
    }
    submit(body, user) {
        return this.handoverService.submit(body, user.sub, user.name, user.role);
    }
    getDisputes() {
        return this.handoverService.getDisputes();
    }
    findAll(query) {
        const filters = {};
        if (query.propertyId)
            filters.propertyId = query.propertyId;
        if (query.status)
            filters.status = query.status;
        if (query.submittedBy)
            filters.submittedBy = query.submittedBy;
        return this.handoverService.findAll(filters);
    }
    findOne(id) {
        return this.handoverService.findOne(id);
    }
    getAuditTrail(id) {
        return this.handoverService.getAuditTrail(id);
    }
    confirm(id, user) {
        return this.handoverService.confirm(id, user.sub, user.name, user.role);
    }
    dispute(id, body, user) {
        return this.handoverService.dispute(id, body, user.sub, user.name, user.role);
    }
    resolve(id, body, user) {
        return this.handoverService.resolve(id, body.resolution, user.sub, user.name, user.role);
    }
};
exports.HandoverController = HandoverController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('consultant'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('disputes'),
    (0, roles_decorator_1.Roles)('operations', 'finance'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "getDisputes", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/audit-trail'),
    (0, roles_decorator_1.Roles)('consultant', 'operations', 'finance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "getAuditTrail", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    (0, roles_decorator_1.Roles)('operations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "confirm", null);
__decorate([
    (0, common_1.Patch)(':id/dispute'),
    (0, roles_decorator_1.Roles)('operations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "dispute", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, roles_decorator_1.Roles)('operations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], HandoverController.prototype, "resolve", null);
exports.HandoverController = HandoverController = __decorate([
    (0, common_1.Controller)('handovers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [handover_service_1.HandoverService])
], HandoverController);
//# sourceMappingURL=handover.controller.js.map