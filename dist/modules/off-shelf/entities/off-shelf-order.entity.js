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
exports.OffShelfOrder = void 0;
const typeorm_1 = require("typeorm");
const off_shelf_status_enum_1 = require("../enums/off-shelf-status.enum");
const off_shelf_reason_enum_1 = require("../enums/off-shelf-reason.enum");
let OffShelfOrder = class OffShelfOrder {
};
exports.OffShelfOrder = OffShelfOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 64 }),
    (0, typeorm_1.Index)('idx_off_shelf_order_no', { unique: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "orderNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "reasonDetail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: () => "'[]'" }),
    __metadata("design:type", Array)
], OffShelfOrder.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], OffShelfOrder.prototype, "totalQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: off_shelf_status_enum_1.OffShelfStatus.CREATED }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "currentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "submitterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "submitterName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], OffShelfOrder.prototype, "submitTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "reviewerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "reviewerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], OffShelfOrder.prototype, "reviewTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "reviewRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64 }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 128 }),
    __metadata("design:type", String)
], OffShelfOrder.prototype, "storeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: () => "'[]'" }),
    __metadata("design:type", Array)
], OffShelfOrder.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], OffShelfOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], OffShelfOrder.prototype, "updatedAt", void 0);
exports.OffShelfOrder = OffShelfOrder = __decorate([
    (0, typeorm_1.Entity)('off_shelf_orders'),
    (0, typeorm_1.Index)('idx_off_shelf_status_created', ['currentStatus', 'createdAt']),
    (0, typeorm_1.Index)('idx_off_shelf_store_created', ['storeId', 'createdAt'])
], OffShelfOrder);
//# sourceMappingURL=off-shelf-order.entity.js.map