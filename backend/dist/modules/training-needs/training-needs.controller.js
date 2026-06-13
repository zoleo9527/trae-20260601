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
exports.TrainingNeedsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const training_needs_service_1 = require("./training-needs.service");
const create_training_need_dto_1 = require("./dto/create-training-need.dto");
const update_training_need_dto_1 = require("./dto/update-training-need.dto");
const approve_training_need_dto_1 = require("./dto/approve-training-need.dto");
const reject_training_need_dto_1 = require("./dto/reject-training-need.dto");
const transfer_training_need_dto_1 = require("./dto/transfer-training-need.dto");
const add_remark_dto_1 = require("./dto/add-remark.dto");
const training_need_query_dto_1 = require("./dto/training-need-query.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const user_entity_1 = require("../../entities/user.entity");
let TrainingNeedsController = class TrainingNeedsController {
    constructor(trainingNeedsService) {
        this.trainingNeedsService = trainingNeedsService;
    }
    async create(createDto, req) {
        return this.trainingNeedsService.create(createDto, req.user.id);
    }
    async findAll(queryDto, req) {
        return this.trainingNeedsService.findAll(queryDto, req.user);
    }
    async findOne(id) {
        return this.trainingNeedsService.findOne(id);
    }
    async update(id, updateDto, req) {
        return this.trainingNeedsService.update(id, updateDto, req.user);
    }
    async remove(id, req) {
        return this.trainingNeedsService.remove(id, req.user);
    }
    async approve(id, approveDto, req) {
        return this.trainingNeedsService.approve(id, approveDto, req.user.id);
    }
    async reject(id, rejectDto, req) {
        return this.trainingNeedsService.reject(id, rejectDto, req.user.id);
    }
    async transfer(id, transferDto, req) {
        return this.trainingNeedsService.transfer(id, transferDto, req.user.id);
    }
    async addRemark(id, addRemarkDto, req) {
        return this.trainingNeedsService.addRemark(id, addRemarkDto, req.user.id);
    }
    async getHistory(id) {
        return this.trainingNeedsService.getHistory(id);
    }
};
exports.TrainingNeedsController = TrainingNeedsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEPARTMENT_HEAD, user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '创建培训需求' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_training_need_dto_1.CreateTrainingNeedDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEPARTMENT_HEAD, user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '获取培训需求列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [training_need_query_dto_1.TrainingNeedQueryDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEPARTMENT_HEAD, user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '获取培训需求详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEPARTMENT_HEAD, user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '更新培训需求' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_training_need_dto_1.UpdateTrainingNeedDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEPARTMENT_HEAD, user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '删除培训需求' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '审批通过培训需求' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '审批成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能审批待审批状态的需求' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_training_need_dto_1.ApproveTrainingNeedDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '驳回培训需求' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '驳回成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能驳回待审批状态的需求' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_training_need_dto_1.RejectTrainingNeedDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/transfer'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '转派培训需求' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '转派成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求或目标经理不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能转派待审批状态的需求' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transfer_training_need_dto_1.TransferTrainingNeedDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)(':id/remarks'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '添加处理备注' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '添加成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_remark_dto_1.AddRemarkDto, Object]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "addRemark", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEPARTMENT_HEAD, user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '获取培训需求处理历史' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrainingNeedsController.prototype, "getHistory", null);
exports.TrainingNeedsController = TrainingNeedsController = __decorate([
    (0, swagger_1.ApiTags)('培训需求'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('training-needs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [training_needs_service_1.TrainingNeedsService])
], TrainingNeedsController);
//# sourceMappingURL=training-needs.controller.js.map