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
exports.TransferOrder = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../enums");
let TransferOrder = class TransferOrder {
};
exports.TransferOrder = TransferOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TransferOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 50 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "orderNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "transferType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "fromStoreId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "fromStoreName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "toStoreId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "toStoreName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: () => "'[]'" }),
    __metadata("design:type", Array)
], TransferOrder.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TransferOrder.prototype, "totalQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real', default: 0 }),
    __metadata("design:type", Number)
], TransferOrder.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: enums_1.TransferStatus.DRAFT }),
    __metadata("design:type", String)
], TransferOrder.prototype, "currentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: enums_1.TransferPriority.MEDIUM }),
    __metadata("design:type", String)
], TransferOrder.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "expectedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "submitterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "submitterName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TransferOrder.prototype, "submitTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "approverId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "approverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TransferOrder.prototype, "approveTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "approveRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], TransferOrder.prototype, "completedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], TransferOrder.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], TransferOrder.prototype, "storeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', default: () => "'[]'" }),
    __metadata("design:type", Array)
], TransferOrder.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], TransferOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], TransferOrder.prototype, "updatedAt", void 0);
exports.TransferOrder = TransferOrder = __decorate([
    (0, typeorm_1.Entity)('transfer_orders'),
    (0, typeorm_1.Index)('idx_transfer_status_created', ['currentStatus', 'createdAt']),
    (0, typeorm_1.Index)('idx_transfer_from_store_created', ['fromStoreId', 'createdAt']),
    (0, typeorm_1.Index)('idx_transfer_to_store_created', ['toStoreId', 'createdAt']),
    (0, typeorm_1.Index)('idx_transfer_priority_created', ['priority', 'createdAt'])
], TransferOrder);
//# sourceMappingURL=transfer-order.entity.js.map