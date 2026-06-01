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
exports.OffShelfItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class OffShelfItemDto {
}
exports.OffShelfItemDto = OffShelfItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '库存ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OffShelfItemDto.prototype, "inventoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '药品名称' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OffShelfItemDto.prototype, "medicineName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '批次号' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OffShelfItemDto.prototype, "batchNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '有效期' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OffShelfItemDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '数量', minimum: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], OffShelfItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '单位' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OffShelfItemDto.prototype, "unit", void 0);
//# sourceMappingURL=off-shelf-item.dto.js.map