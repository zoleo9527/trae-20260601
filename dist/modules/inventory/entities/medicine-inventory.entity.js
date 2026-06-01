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
exports.MedicineInventory = void 0;
const typeorm_1 = require("typeorm");
const near_expiry_alert_entity_1 = require("./near-expiry-alert.entity");
let MedicineInventory = class MedicineInventory {
};
exports.MedicineInventory = MedicineInventory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MedicineInventory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medicine_code', length: 50 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "medicineCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medicine_name', length: 200 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "medicineName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "specification", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "manufacturer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'batch_no', length: 50 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "batchNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'date' }),
    __metadata("design:type", Date)
], MedicineInventory.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'real' }),
    __metadata("design:type", Number)
], MedicineInventory.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_price', type: 'real' }),
    __metadata("design:type", Number)
], MedicineInventory.prototype, "purchasePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'selling_price', type: 'real' }),
    __metadata("design:type", Number)
], MedicineInventory.prototype, "sellingPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'store_id', length: 50 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "storeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'store_name', length: 100 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "storeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MedicineInventory.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_count_time', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], MedicineInventory.prototype, "lastCountTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'datetime' }),
    __metadata("design:type", Date)
], MedicineInventory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'datetime' }),
    __metadata("design:type", Date)
], MedicineInventory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => near_expiry_alert_entity_1.NearExpiryAlert, alert => alert.inventory),
    __metadata("design:type", Array)
], MedicineInventory.prototype, "alerts", void 0);
exports.MedicineInventory = MedicineInventory = __decorate([
    (0, typeorm_1.Entity)('medicine_inventory'),
    (0, typeorm_1.Index)(['medicineCode', 'batchNo'], { unique: true }),
    (0, typeorm_1.Index)(['expiryDate']),
    (0, typeorm_1.Index)(['storeId'])
], MedicineInventory);
//# sourceMappingURL=medicine-inventory.entity.js.map