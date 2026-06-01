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
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    (0, swagger_1.ApiProperty)({ description: '日志ID' }),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: false }),
    (0, swagger_1.ApiProperty)({ description: '模块名称' }),
    __metadata("design:type", String)
], AuditLog.prototype, "module", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: false }),
    (0, swagger_1.ApiProperty)({ description: '操作类型' }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '关联实体ID' }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '操作前状态' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "beforeState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '操作后状态' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "afterState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '备注' }),
    __metadata("design:type", String)
], AuditLog.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '操作人ID' }),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '操作人姓名' }),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '操作人角色' }),
    __metadata("design:type", String)
], AuditLog.prototype, "operatorRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '门店ID' }),
    __metadata("design:type", String)
], AuditLog.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '门店名称' }),
    __metadata("design:type", String)
], AuditLog.prototype, "storeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '请求ID' }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, swagger_1.ApiProperty)({ description: '操作是否成功' }),
    __metadata("design:type", Boolean)
], AuditLog.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '请求数据' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "requestData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    (0, swagger_1.ApiProperty)({ description: '响应数据' }),
    __metadata("design:type", Object)
], AuditLog.prototype, "responseData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)('idx_audit_log_module_created_at', ['module', 'createdAt']),
    (0, typeorm_1.Index)('idx_audit_log_operator_created_at', ['operatorId', 'createdAt']),
    (0, typeorm_1.Index)('idx_audit_log_store_created_at', ['storeId', 'createdAt'])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map