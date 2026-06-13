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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const path = require("path");
const auth_module_1 = require("./modules/auth/auth.module");
const training_needs_module_1 = require("./modules/training-needs/training-needs.module");
const course_projects_module_1 = require("./modules/course-projects/course-projects.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
let AppModule = class AppModule {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'better-sqlite3',
                database: path.join(__dirname, '../database/training.db'),
                entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
                synchronize: true,
                logging: false,
            }),
            auth_module_1.AuthModule,
            training_needs_module_1.TrainingNeedsModule,
            course_projects_module_1.CourseProjectsModule,
            notifications_module_1.NotificationsModule,
        ],
    }),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AppModule);
//# sourceMappingURL=app.module.js.map