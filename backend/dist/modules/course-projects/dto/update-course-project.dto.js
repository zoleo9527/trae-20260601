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
exports.UpdateCourseProjectDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateCourseProjectDto {
}
exports.UpdateCourseProjectDto = UpdateCourseProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程名称', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCourseProjectDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程描述', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCourseProjectDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程目标', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCourseProjectDto.prototype, "objectives", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程大纲', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCourseProjectDto.prototype, "outline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '讲师ID', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCourseProjectDto.prototype, "instructorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '培训开始时间', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateCourseProjectDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '培训结束时间', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateCourseProjectDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '培训地点', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCourseProjectDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '报名截止时间', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateCourseProjectDto.prototype, "enrollmentDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最大参训人数', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateCourseProjectDto.prototype, "maxParticipants", void 0);
//# sourceMappingURL=update-course-project.dto.js.map