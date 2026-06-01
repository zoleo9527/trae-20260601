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
exports.QueryOffShelfDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const off_shelf_status_enum_1 = require("../enums/off-shelf-status.enum");
const off_shelf_reason_enum_1 = require("../enums/off-shelf-reason.enum");
class QueryOffShelfDto extends pagination_dto_1.PaginationQueryDto {
}
exports.QueryOffShelfDto = QueryOffShelfDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: off_shelf_status_enum_1.OffShelfStatus, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(off_shelf_status_enum_1.OffShelfStatus),
    __metadata("design:type", String)
], QueryOffShelfDto.prototype, "currentStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '下架原因', enum: off_shelf_reason_enum_1.OffShelfReason, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(off_shelf_reason_enum_1.OffShelfReason),
    __metadata("design:type", String)
], QueryOffShelfDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '门店ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryOffShelfDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开始时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryOffShelfDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '结束时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryOffShelfDto.prototype, "endTime", void 0);
//# sourceMappingURL=query-off-shelf.dto.js.map