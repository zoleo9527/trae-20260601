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
exports.PrescriptionQueryDto = exports.VoidPrescriptionDto = exports.SupplementPrescriptionDto = exports.RejectPrescriptionDto = exports.ApprovePrescriptionDto = exports.ReviewPrescriptionDto = exports.SubmitPrescriptionDto = exports.UpdatePrescriptionDto = exports.CreatePrescriptionDto = exports.MedicineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const prescription_enum_1 = require("./prescription.enum");
class MedicineDto {
}
exports.MedicineDto = MedicineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '药品名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '规格' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "specification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '剂量' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "dosage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用法频率' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '数量' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], MedicineDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '单位' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "remark", void 0);
class CreatePrescriptionDto {
}
exports.CreatePrescriptionDto = CreatePrescriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '处方编号' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "prescriptionNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '患者姓名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '患者年龄' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreatePrescriptionDto.prototype, "patientAge", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '患者性别', enum: ['男', '女', '未知'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "patientGender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开具医生姓名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "doctorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '科室' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '诊断' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "diagnosis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '药品列表', type: [MedicineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicineDto),
    __metadata("design:type", Array)
], CreatePrescriptionDto.prototype, "medicines", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '门店ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '门店名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePrescriptionDto.prototype, "storeName", void 0);
class UpdatePrescriptionDto {
}
exports.UpdatePrescriptionDto = UpdatePrescriptionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '患者姓名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrescriptionDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '患者年龄' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePrescriptionDto.prototype, "patientAge", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '患者性别', enum: ['男', '女', '未知'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrescriptionDto.prototype, "patientGender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '开具医生姓名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrescriptionDto.prototype, "doctorName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '科室' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrescriptionDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '诊断' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrescriptionDto.prototype, "diagnosis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '药品列表', type: [MedicineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicineDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdatePrescriptionDto.prototype, "medicines", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePrescriptionDto.prototype, "remark", void 0);
class SubmitPrescriptionDto {
}
exports.SubmitPrescriptionDto = SubmitPrescriptionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '提交备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubmitPrescriptionDto.prototype, "remark", void 0);
class ReviewPrescriptionDto {
}
exports.ReviewPrescriptionDto = ReviewPrescriptionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '审核备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReviewPrescriptionDto.prototype, "remark", void 0);
class ApprovePrescriptionDto {
}
exports.ApprovePrescriptionDto = ApprovePrescriptionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '审核通过备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ApprovePrescriptionDto.prototype, "reviewRemark", void 0);
class RejectPrescriptionDto {
}
exports.RejectPrescriptionDto = RejectPrescriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '拒绝原因' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RejectPrescriptionDto.prototype, "rejectReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '审核备注' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RejectPrescriptionDto.prototype, "reviewRemark", void 0);
class SupplementPrescriptionDto {
}
exports.SupplementPrescriptionDto = SupplementPrescriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '补充说明' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SupplementPrescriptionDto.prototype, "supplementRemark", void 0);
class VoidPrescriptionDto {
}
exports.VoidPrescriptionDto = VoidPrescriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '作废原因' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VoidPrescriptionDto.prototype, "remark", void 0);
class PrescriptionQueryDto extends pagination_dto_1.PaginationQueryDto {
}
exports.PrescriptionQueryDto = PrescriptionQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '处方状态', enum: prescription_enum_1.PrescriptionStatus }),
    (0, class_validator_1.IsEnum)(prescription_enum_1.PrescriptionStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrescriptionQueryDto.prototype, "currentStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '门店ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrescriptionQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '患者姓名' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrescriptionQueryDto.prototype, "patientName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '开始时间' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrescriptionQueryDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '结束时间' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrescriptionQueryDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '处方编号' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PrescriptionQueryDto.prototype, "prescriptionNo", void 0);
//# sourceMappingURL=prescription.dto.js.map