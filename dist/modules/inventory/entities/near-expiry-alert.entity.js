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
exports.NearExpiryAlert = exports.AlertAction = exports.AlertStatus = exports.AlertLevel = void 0;
const typeorm_1 = require("typeorm");
const medicine_inventory_entity_1 = require("./medicine-inventory.entity");
var AlertLevel;
(function (AlertLevel) {
    AlertLevel["HIGH"] = "HIGH";
    AlertLevel["MEDIUM"] = "MEDIUM";
    AlertLevel["LOW"] = "LOW";
})(AlertLevel || (exports.AlertLevel = AlertLevel = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    AlertStatus["RESOLVED"] = "RESOLVED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
var AlertAction;
(function (AlertAction) {
    AlertAction["ACKNOWLEDGE"] = "ACKNOWLEDGE";
    AlertAction["RESOLVE"] = "RESOLVE";
})(AlertAction || (exports.AlertAction = AlertAction = {}));
let NearExpiryAlert = class NearExpiryAlert {
};
exports.NearExpiryAlert = NearExpiryAlert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inventory_id', length: 50 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "inventoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medicine_code', length: 50 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "medicineCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medicine_name', length: 200 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "medicineName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'batch_no', length: 50 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "batchNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'date' }),
    __metadata("design:type", Date)
], NearExpiryAlert.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_quantity', type: 'real' }),
    __metadata("design:type", Number)
], NearExpiryAlert.prototype, "currentQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'days_to_expiry', type: 'int' }),
    __metadata("design:type", Number)
], NearExpiryAlert.prototype, "daysToExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'alert_level', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "alertLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: AlertStatus.ACTIVE }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acknowledged_by', length: 50, nullable: true }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "acknowledgedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acknowledged_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], NearExpiryAlert.prototype, "acknowledgedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'acknowledged_remark', length: 500, nullable: true }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "acknowledgedRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolved_by', length: 50, nullable: true }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolved_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], NearExpiryAlert.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolved_remark', length: 500, nullable: true }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "resolvedRemark", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'store_id', length: 50 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'store_name', length: 100 }),
    __metadata("design:type", String)
], NearExpiryAlert.prototype, "storeName", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], NearExpiryAlert.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], NearExpiryAlert.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => medicine_inventory_entity_1.MedicineInventory, inventory => inventory.alerts),
    (0, typeorm_1.JoinColumn)({ name: 'inventory_id' }),
    __metadata("design:type", medicine_inventory_entity_1.MedicineInventory)
], NearExpiryAlert.prototype, "inventory", void 0);
exports.NearExpiryAlert = NearExpiryAlert = __decorate([
    (0, typeorm_1.Entity)('near_expiry_alert'),
    (0, typeorm_1.Index)(['status', 'createdAt']),
    (0, typeorm_1.Index)(['alertLevel', 'daysToExpiry'])
], NearExpiryAlert);
//# sourceMappingURL=near-expiry-alert.entity.js.map