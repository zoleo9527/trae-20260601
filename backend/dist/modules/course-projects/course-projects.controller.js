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
exports.CourseProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const course_projects_service_1 = require("./course-projects.service");
const create_course_project_dto_1 = require("./dto/create-course-project.dto");
const update_course_project_dto_1 = require("./dto/update-course-project.dto");
const course_project_query_dto_1 = require("./dto/course-project-query.dto");
const add_student_dto_1 = require("./dto/add-student.dto");
const mark_absent_dto_1 = require("./dto/mark-absent.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const user_entity_1 = require("../../entities/user.entity");
let CourseProjectsController = class CourseProjectsController {
    constructor(courseProjectsService) {
        this.courseProjectsService = courseProjectsService;
    }
    async create(createDto) {
        return this.courseProjectsService.create(createDto);
    }
    async findAll(queryDto, req) {
        return this.courseProjectsService.findAll(queryDto, req.user);
    }
    async findOne(id) {
        return this.courseProjectsService.findOne(id);
    }
    async update(id, updateDto, req) {
        return this.courseProjectsService.update(id, updateDto, req.user);
    }
    async remove(id, req) {
        return this.courseProjectsService.remove(id, req.user);
    }
    async approve(id, req) {
        return this.courseProjectsService.approve(id, req.user.id);
    }
    async reject(id, reason, req) {
        return this.courseProjectsService.reject(id, reason, req.user.id);
    }
    async publish(id, req) {
        return this.courseProjectsService.publish(id, req.user.id);
    }
    async cancel(id, req) {
        return this.courseProjectsService.cancel(id, req.user.id);
    }
    async getStudents(id) {
        return this.courseProjectsService.getStudents(id);
    }
    async addStudent(id, addStudentDto) {
        return this.courseProjectsService.addStudent(id, addStudentDto);
    }
    async removeStudent(id, studentId, req) {
        return this.courseProjectsService.removeStudent(id, studentId, req.user);
    }
    async markStudentAbsent(id, studentId, markAbsentDto) {
        return this.courseProjectsService.markStudentAbsent(id, studentId, markAbsentDto);
    }
    async getRemarks(id) {
        return this.courseProjectsService.getRemarks(id);
    }
};
exports.CourseProjectsController = CourseProjectsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '创建课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '培训需求或讲师不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能为已审批通过的培训需求创建立项' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_course_project_dto_1.CreateCourseProjectDto]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '获取课程立项列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [course_project_query_dto_1.CourseProjectQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '获取课程立项详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '更新课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_course_project_dto_1.UpdateCourseProjectDto, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '删除课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '审批通过课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '审批成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能审批待审批状态的立项' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '驳回课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '驳回成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能驳回待审批状态的立项' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '发布课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '发布成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '只能发布已审批通过的课程' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '取消课程立项' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '取消成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '已完成的课程不能取消' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id/students'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '获取课程学员列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Post)(':id/students'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '添加学员（报名）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '添加成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '课程人数已满或学员已报名' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_student_dto_1.AddStudentDto]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "addStudent", null);
__decorate([
    (0, common_1.Delete)(':id/students/:studentId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER),
    (0, swagger_1.ApiOperation)({ summary: '移除学员' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '移除成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项或学员不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "removeStudent", null);
__decorate([
    (0, common_1.Post)(':id/students/:studentId/absent'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '标记学员缺席' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '标记成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项或学员不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mark_absent_dto_1.MarkAbsentDto]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "markStudentAbsent", null);
__decorate([
    (0, common_1.Get)(':id/remarks'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.TRAINING_MANAGER, user_entity_1.UserRole.INSTRUCTOR),
    (0, swagger_1.ApiOperation)({ summary: '获取关联的培训需求备注' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权限' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '课程立项不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CourseProjectsController.prototype, "getRemarks", null);
exports.CourseProjectsController = CourseProjectsController = __decorate([
    (0, swagger_1.ApiTags)('课程立项'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('course-projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [course_projects_service_1.CourseProjectsService])
], CourseProjectsController);
//# sourceMappingURL=course-projects.controller.js.map