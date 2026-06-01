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
exports.NearExpiryMedicineQueryDto = exports.ResolveAlertDto = exports.AcknowledgeAlertDto = exports.NearExpiryAlertQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const near_expiry_alert_entity_1 = require("../entities/near-expiry-alert.entity");
class NearExpiryAlertQueryDto extends pagination_dto_1.PaginationQueryDto {
}
exports.NearExpiryAlertQueryDto = NearExpiryAlertQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(near_expiry_alert_entity_1.AlertLevel),
    __metadata("design:type", String)
], NearExpiryAlertQueryDto.prototype, "alertLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(near_expiry_alert_entity_1.AlertStatus),
    __metadata("design:type", String)
], NearExpiryAlertQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NearExpiryAlertQueryDto.prototype, "minDaysToExpiry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NearExpiryAlertQueryDto.prototype, "maxDaysToExpiry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NearExpiryAlertQueryDto.prototype, "storeId", void 0);
class AcknowledgeAlertDto {
}
exports.AcknowledgeAlertDto = AcknowledgeAlertDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcknowledgeAlertDto.prototype, "remark", void 0);
class ResolveAlertDto {
}
exports.ResolveAlertDto = ResolveAlertDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveAlertDto.prototype, "remark", void 0);
class NearExpiryMedicineQueryDto {
    constructor() {
        this.daysToExpiry = 90;
    }
}
exports.NearExpiryMedicineQueryDto = NearExpiryMedicineQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], NearExpiryMedicineQueryDto.prototype, "daysToExpiry", void 0);
//# sourceMappingURL=near-expiry-alert.dto.js.map