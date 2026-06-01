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
exports.QueryTransferDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const enums_1 = require("../enums");
class QueryTransferDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryTransferDto = QueryTransferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.TransferStatus, description: '状态', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.TransferStatus),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "currentStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.TransferType, description: '调拨类型', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.TransferType),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "transferType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.TransferPriority, description: '优先级', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.TransferPriority),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调出门店ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "fromStoreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调入门店ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "toStoreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开始时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '结束时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryTransferDto.prototype, "endTime", void 0);
//# sourceMappingURL=query-transfer.dto.js.map