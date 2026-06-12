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
exports.ViewingController = void 0;
const common_1 = require("@nestjs/common");
const viewing_service_1 = require("./viewing.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ViewingController = class ViewingController {
    constructor(viewingService) {
        this.viewingService = viewingService;
    }
    create(body, user) {
        return this.viewingService.create({
            propertyId: body.propertyId,
            consultantId: body.consultantId,
            consultantName: body.consultantName,
            viewerName: body.viewerName,
            viewerCompany: body.viewerCompany,
            viewerContact: body.viewerContact,
            viewDate: new Date(body.viewDate),
        }, user.userId ?? user.sub, user.userName ?? user.name, user.role);
    }
    findAll(filters) {
        return this.viewingService.findAll(filters);
    }
    getPropertyViewingSummary(propertyId) {
        return this.viewingService.getPropertyViewingSummary(propertyId);
    }
    getPropertyViewingSummaryLegacy(propertyId) {
        return this.viewingService.getPropertyViewingSummary(propertyId);
    }
    findOne(id) {
        return this.viewingService.findOne(id);
    }
    addFeedback(id, body, user) {
        return this.viewingService.addFeedback(id, {
            satisfaction: body.satisfaction,
            notes: body.notes,
            followUpAction: body.followUpAction,
        }, user.userId ?? user.sub, user.userName ?? user.name, user.role);
    }
};
exports.ViewingController = ViewingController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('consultant'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ViewingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ViewingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary/:propertyId'),
    __param(0, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViewingController.prototype, "getPropertyViewingSummary", null);
__decorate([
    (0, common_1.Get)('property/:propertyId/summary'),
    __param(0, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViewingController.prototype, "getPropertyViewingSummaryLegacy", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ViewingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/feedback'),
    (0, roles_decorator_1.Roles)('consultant'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ViewingController.prototype, "addFeedback", null);
exports.ViewingController = ViewingController = __decorate([
    (0, common_1.Controller)('viewings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [viewing_service_1.ViewingService])
], ViewingController);
//# sourceMappingURL=viewing.controller.js.map