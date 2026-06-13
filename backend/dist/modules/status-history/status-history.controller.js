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
exports.StatusHistoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const status_history_service_1 = require("./status-history.service");
const status_change_history_entity_1 = require("../../entities/status-change-history.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const user_entity_1 = require("../../entities/user.entity");
let StatusHistoryController = class StatusHistoryController {
    constructor(statusHistoryService) {
        this.statusHistoryService = statusHistoryService;
    }
    async getTrainingNeedHistory(id) {
        const histories = await this.statusHistoryService.getHistoryByEntity(status_change_history_entity_1.EntityType.TRAINING_NEED, id);
        const latest = histories.length > 0 ? histories[histories.length - 1] : null;
        const timeline = this.buildTimeline(histories);
        return {
            entityType: 'training_need',
            entityId: id,
            totalChanges: histories.length,
            latest: latest,
            timeline: timeline,
        };
    }
    async getCourseProjectHistory(id) {
        const histories = await this.statusHistoryService.getHistoryByEntity(status_change_history_entity_1.EntityType.COURSE_PROJECT, id);
        const latest = histories.length > 0 ? histories[histories.length - 1] : null;
        const timeline = this.buildTimeline(histories);
        return {
            entityType: 'course_project',
            entityId: id,
            totalChanges: histories.length,
            latest: latest,
            timeline: timeline,
        };
    }
    async getTrainingNeedLatestChange(id) {
        const latest = await this.statusHistoryService.getLatestStatusChange(status_change_history_entity_1.EntityType.TRAINING_NEED, id);
        return {
            entityType: 'training_need',
            entityId: id,
            latest: latest,
        };
    }
    async getCourseProjectLatestChange(id) {
        const latest = await this.statusHistoryService.getLatestStatusChange(status_change_history_entity_1.EntityType.COURSE_PROJECT, id);
        return {
            entityType: 'course_project',
            entityId: id,
            latest: latest,
        };
    }
    buildTimeline(histories) {
        return histories.map((history, index) => ({
            step: index + 1,
            fromStatus: history.fromStatus,
            toStatus: history.toStatus,
            handler: history.changedBy ? {
                id: history.changedBy.id,
                name: history.changedBy.name,
            } : null,
            reason: history.reason,
            remarks: history.remarks,
            timestamp: history.createdAt,
            statusLabel: this.getStatusLabel(history.toStatus),
            actionLabel: this.getActionLabel(history.fromStatus, history.toStatus),
        }));
    }
    getStatusLabel(status) {
        const statusMap = {
            'pending': '待审批',
            'approved': '已通过',
            'rejected': '已驳回',
            'transferred': '已转派',
            'published': '已发布',
            'in_progress': '进行中',
            'completed': '已完成',
            'cancelled': '已取消',
            'enrolled': '已报名',
            'attended': '已出席',
            'absent': '已缺席',
        };
        return statusMap[status] || status;
    }
    getActionLabel(fromStatus, toStatus) {
        const actionMap = {
            'pending->approved': '审批通过',
            'pending->rejected': '驳回',
            'pending->transferred': '转派',
            'transferred->approved': '审批通过',
            'transferred->rejected': '驳回',
            'transferred->transferred': '再次转派',
            'approved->published': '发布',
            'approved->cancelled': '取消',
            'published->in_progress': '开始培训',
            'published->cancelled': '取消',
            'in_progress->completed': '完成培训',
            'completed->cancelled': '取消',
        };
        return actionMap[`${fromStatus}->${toStatus}`] || `${fromStatus} -> ${toStatus}`;
    }
};
exports.StatusHistoryController = StatusHistoryController;
__decorate([
    (0, common_1.Get)('training-needs/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.DEPARTMENT_HEAD),
    (0, swagger_1.ApiOperation)({ summary: '获取培训需求的状态变更历史' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '培训需求ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatusHistoryController.prototype, "getTrainingNeedHistory", null);
__decorate([
    (0, common_1.Get)('course-projects/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '获取课程立项的状态变更历史' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '课程立项ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatusHistoryController.prototype, "getCourseProjectHistory", null);
__decorate([
    (0, common_1.Get)('training-needs/:id/latest'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.DEPARTMENT_HEAD),
    (0, swagger_1.ApiOperation)({ summary: '获取培训需求的最近状态变更' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '培训需求ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatusHistoryController.prototype, "getTrainingNeedLatestChange", null);
__decorate([
    (0, common_1.Get)('course-projects/:id/latest'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '获取课程立项的最近状态变更' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '课程立项ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatusHistoryController.prototype, "getCourseProjectLatestChange", null);
exports.StatusHistoryController = StatusHistoryController = __decorate([
    (0, swagger_1.ApiTags)('状态历史'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('status-history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [status_history_service_1.StatusChangeHistoryService])
], StatusHistoryController);
//# sourceMappingURL=status-history.controller.js.map