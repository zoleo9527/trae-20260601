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
exports.Prescription = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const prescription_enum_1 = require("./prescription.enum");
let Prescription = class Prescription {
};
exports.Prescription = Prescription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    (0, swagger_1.ApiProperty)({ description: '处方ID' }),
    __metadata("design:type", String)
], Prescription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 50 }),
    (0, typeorm_1.Index)('uk_prescription_no', { unique: true }),
    (0, swagger_1.ApiProperty)({ description: '处方编号' }),
    __metadata("design:type", String)
], Prescription.prototype, "prescriptionNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '患者姓名' }),
    __metadata("design:type", String)
], Prescription.prototype, "patientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, swagger_1.ApiProperty)({ description: '患者年龄' }),
    __metadata("design:type", Number)
], Prescription.prototype, "patientAge", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    (0, swagger_1.ApiProperty)({ description: '患者性别', enum: ['男', '女', '未知'] }),
    __metadata("design:type", String)
], Prescription.prototype, "patientGender", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '开具医生姓名' }),
    __metadata("design:type", String)
], Prescription.prototype, "doctorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '科室' }),
    __metadata("design:type", String)
], Prescription.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    (0, swagger_1.ApiProperty)({ description: '诊断' }),
    __metadata("design:type", String)
], Prescription.prototype, "diagnosis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: () => "'[]'" }),
    (0, swagger_1.ApiProperty)({ description: '药品列表', type: [Object] }),
    __metadata("design:type", Array)
], Prescription.prototype, "medicines", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '备注' }),
    __metadata("design:type", String)
], Prescription.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: prescription_enum_1.PrescriptionStatus.DRAFT }),
    (0, swagger_1.ApiProperty)({ description: '当前状态', enum: prescription_enum_1.PrescriptionStatus }),
    __metadata("design:type", String)
], Prescription.prototype, "currentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '提交人ID' }),
    __metadata("design:type", String)
], Prescription.prototype, "submitterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '提交人姓名' }),
    __metadata("design:type", String)
], Prescription.prototype, "submitterName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '提交时间' }),
    __metadata("design:type", Date)
], Prescription.prototype, "submitTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '审核人ID' }),
    __metadata("design:type", String)
], Prescription.prototype, "reviewerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '审核人姓名' }),
    __metadata("design:type", String)
], Prescription.prototype, "reviewerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '审核时间' }),
    __metadata("design:type", Date)
], Prescription.prototype, "reviewTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '审核备注' }),
    __metadata("design:type", String)
], Prescription.prototype, "reviewRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '拒绝原因' }),
    __metadata("design:type", String)
], Prescription.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '补充说明' }),
    __metadata("design:type", String)
], Prescription.prototype, "supplementRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '补充时间' }),
    __metadata("design:type", Date)
], Prescription.prototype, "supplementTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    (0, swagger_1.ApiProperty)({ description: '门店ID' }),
    __metadata("design:type", String)
], Prescription.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    (0, swagger_1.ApiProperty)({ description: '门店名称' }),
    __metadata("design:type", String)
], Prescription.prototype, "storeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: () => "'[]'" }),
    (0, swagger_1.ApiProperty)({ description: '状态变更审计日志', type: [Object] }),
    __metadata("design:type", Array)
], Prescription.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    __metadata("design:type", Date)
], Prescription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    __metadata("design:type", Date)
], Prescription.prototype, "updatedAt", void 0);
exports.Prescription = Prescription = __decorate([
    (0, typeorm_1.Entity)('prescriptions'),
    (0, typeorm_1.Index)('idx_prescription_status_created', ['currentStatus', 'createdAt']),
    (0, typeorm_1.Index)('idx_prescription_store_created', ['storeId', 'createdAt'])
], Prescription);
//# sourceMappingURL=prescription.entity.js.map