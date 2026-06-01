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
exports.BatchApproveDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../enums");
class BatchApproveDto {
}
exports.BatchApproveDto = BatchApproveDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: '调拨单ID数组' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BatchApproveDto.prototype, "ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: [enums_1.TransferAction.APPROVE, enums_1.TransferAction.REJECT], description: '审批动作' }),
    (0, class_validator_1.IsEnum)([enums_1.TransferAction.APPROVE, enums_1.TransferAction.REJECT]),
    __metadata("design:type", String)
], BatchApproveDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '审批备注', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchApproveDto.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '拒绝原因（拒绝时必填）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchApproveDto.prototype, "rejectReason", void 0);
//# sourceMappingURL=batch-approve.dto.js.map