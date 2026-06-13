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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseProjectQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const course_project_entity_1 = require("../../entities/course-project.entity");
class CourseProjectQueryDto {
    constructor() {
        this.page = 1;
        this.pageSize = 10;
    }
}
exports.CourseProjectQueryDto = CourseProjectQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false, default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CourseProjectQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', required: false, default: 10 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CourseProjectQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: course_project_entity_1.CourseProjectStatus, required: false }),
    (0, class_validator_1.IsEnum)(course_project_entity_1.CourseProjectStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof course_project_entity_1.CourseProjectStatus !== "undefined" && course_project_entity_1.CourseProjectStatus) === "function" ? _a : Object)
], CourseProjectQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '讲师ID', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CourseProjectQueryDto.prototype, "instructorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开始日期', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CourseProjectQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '结束日期', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CourseProjectQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关键词（标题/描述）', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CourseProjectQueryDto.prototype, "keyword", void 0);
//# sourceMappingURL=course-project-query.dto.js.map