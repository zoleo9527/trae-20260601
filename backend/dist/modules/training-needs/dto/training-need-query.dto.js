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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingNeedQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const training_need_entity_1 = require("../../entities/training-need.entity");
class TrainingNeedQueryDto {
    constructor() {
        this.page = 1;
        this.pageSize = 10;
    }
}
exports.TrainingNeedQueryDto = TrainingNeedQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false, default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TrainingNeedQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', required: false, default: 10 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TrainingNeedQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: training_need_entity_1.TrainingNeedStatus, required: false }),
    (0, class_validator_1.IsEnum)(training_need_entity_1.TrainingNeedStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof training_need_entity_1.TrainingNeedStatus !== "undefined" && training_need_entity_1.TrainingNeedStatus) === "function" ? _a : Object)
], TrainingNeedQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '部门', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrainingNeedQueryDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '紧急程度', enum: training_need_entity_1.Urgency, required: false }),
    (0, class_validator_1.IsEnum)(training_need_entity_1.Urgency),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof training_need_entity_1.Urgency !== "undefined" && training_need_entity_1.Urgency) === "function" ? _b : Object)
], TrainingNeedQueryDto.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开始日期', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], TrainingNeedQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '结束日期', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], TrainingNeedQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关键词（标题/描述）', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TrainingNeedQueryDto.prototype, "keyword", void 0);
//# sourceMappingURL=training-need-query.dto.js.map