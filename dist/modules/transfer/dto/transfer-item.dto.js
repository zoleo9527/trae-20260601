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
exports.TransferItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class TransferItemDto {
}
exports.TransferItemDto = TransferItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '药品ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "medicineId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '药品名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "medicineName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '批号' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "batchNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '有效期' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '数量' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], TransferItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '单位' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferItemDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '售价' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], TransferItemDto.prototype, "sellingPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '小计' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], TransferItemDto.prototype, "subtotal", void 0);
//# sourceMappingURL=transfer-item.dto.js.map