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
exports.CreateCourseProjectDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCourseProjectDto {
}
exports.CreateCourseProjectDto = CreateCourseProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关联的培训需求ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "trainingNeedId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程描述' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程目标' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "objectives", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程大纲' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "outline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '讲师ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "instructorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '培训开始时间' }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateCourseProjectDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '培训结束时间' }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateCourseProjectDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '培训地点' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCourseProjectDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '报名截止时间' }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateCourseProjectDto.prototype, "enrollmentDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最大参训人数' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateCourseProjectDto.prototype, "maxParticipants", void 0);
//# sourceMappingURL=create-course-project.dto.js.map