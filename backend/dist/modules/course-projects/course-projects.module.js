"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseProjectsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const course_projects_controller_1 = require("./course-projects.controller");
const course_projects_service_1 = require("./course-projects.service");
const course_project_entity_1 = require("../../entities/course-project.entity");
const training_need_entity_1 = require("../../entities/training-need.entity");
const training_need_remark_entity_1 = require("../../entities/training-need-remark.entity");
const student_entity_1 = require("../../entities/student.entity");
const user_entity_1 = require("../../entities/user.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const status_history_module_1 = require("../status-history/status-history.module");
let CourseProjectsModule = class CourseProjectsModule {
};
exports.CourseProjectsModule = CourseProjectsModule;
exports.CourseProjectsModule = CourseProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([course_project_entity_1.CourseProject, training_need_entity_1.TrainingNeed, training_need_remark_entity_1.TrainingNeedRemark, student_entity_1.Student, user_entity_1.User]),
            notifications_module_1.NotificationsModule,
            status_history_module_1.StatusHistoryModule,
        ],
        controllers: [course_projects_controller_1.CourseProjectsController],
        providers: [course_projects_service_1.CourseProjectsService],
        exports: [course_projects_service_1.CourseProjectsService],
    })
], CourseProjectsModule);
//# sourceMappingURL=course-projects.module.js.map