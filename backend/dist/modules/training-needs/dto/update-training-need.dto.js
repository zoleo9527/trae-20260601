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
exports.UpdateTrainingNeedDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const training_need_entity_1 = require("../../entities/training-need.entity");
class UpdateTrainingNeedDto {
}
exports.UpdateTrainingNeedDto = UpdateTrainingNeedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '需求标题', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTrainingNeedDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '需求描述', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTrainingNeedDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '部门', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTrainingNeedDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '期望日期', required: false }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateTrainingNeedDto.prototype, "expectedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预计参训人数', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateTrainingNeedDto.prototype, "participantCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预算', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateTrainingNeedDto.prototype, "budget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '紧急程度', enum: training_need_entity_1.Urgency, required: false }),
    (0, class_validator_1.IsEnum)(training_need_entity_1.Urgency),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof training_need_entity_1.Urgency !== "undefined" && training_need_entity_1.Urgency) === "function" ? _a : Object)
], UpdateTrainingNeedDto.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '附件列表', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateTrainingNeedDto.prototype, "attachments", void 0);
//# sourceMappingURL=update-training-need.dto.js.map