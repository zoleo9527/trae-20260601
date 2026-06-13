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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notifications_service_1 = require("./notifications.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const user_entity_1 = require("../../entities/user.entity");
const notification_entity_1 = require("../../entities/notification.entity");
let NotificationsController = class NotificationsController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getLogs(page = 1, pageSize = 10) {
        return this.notificationService.getLogs(page, pageSize);
    }
    async findAll(page = 1, pageSize = 10, type, isRead) {
        return this.notificationService.findAll(page, pageSize, type, isRead);
    }
    async findOne(id) {
        return this.notificationService.findOne(id);
    }
    async markAsRead(id) {
        await this.notificationService.markAsRead(id);
        return { message: '标记成功' };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '获取本地通知日志' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '获取通知记录列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('isRead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '获取通知详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '通知不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/read'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '标记通知为已读' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '标记成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('通知'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [notifications_service_1.NotificationService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map