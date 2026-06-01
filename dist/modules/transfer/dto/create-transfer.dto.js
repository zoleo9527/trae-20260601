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
exports.CreateTransferDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../enums");
const transfer_item_dto_1 = require("./transfer-item.dto");
class CreateTransferDto {
}
exports.CreateTransferDto = CreateTransferDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.TransferType, description: '调拨类型' }),
    (0, class_validator_1.IsEnum)(enums_1.TransferType),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "transferType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调出门店ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "fromStoreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调出门店名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "fromStoreName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调入门店ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "toStoreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '调入门店名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "toStoreName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [transfer_item_dto_1.TransferItemDto], description: '调拨明细' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => transfer_item_dto_1.TransferItemDto),
    __metadata("design:type", Array)
], CreateTransferDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.TransferPriority, description: '优先级', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.TransferPriority),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '期望日期', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "expectedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '门店ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '门店名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTransferDto.prototype, "storeName", void 0);
//# sourceMappingURL=create-transfer.dto.js.map