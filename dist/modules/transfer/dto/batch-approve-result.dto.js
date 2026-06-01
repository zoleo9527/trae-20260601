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
exports.BatchApproveResultDto = exports.BatchApproveResultItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BatchApproveResultItemDto {
}
exports.BatchApproveResultItemDto = BatchApproveResultItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调拨单ID' }),
    __metadata("design:type", String)
], BatchApproveResultItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否成功' }),
    __metadata("design:type", Boolean)
], BatchApproveResultItemDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '错误码' }),
    __metadata("design:type", String)
], BatchApproveResultItemDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '消息' }),
    __metadata("design:type", String)
], BatchApproveResultItemDto.prototype, "message", void 0);
class BatchApproveResultDto {
}
exports.BatchApproveResultDto = BatchApproveResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '成功数量' }),
    __metadata("design:type", Number)
], BatchApproveResultDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '失败数量' }),
    __metadata("design:type", Number)
], BatchApproveResultDto.prototype, "failCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BatchApproveResultItemDto], description: '详细结果' }),
    __metadata("design:type", Array)
], BatchApproveResultDto.prototype, "results", void 0);
//# sourceMappingURL=batch-approve-result.dto.js.map