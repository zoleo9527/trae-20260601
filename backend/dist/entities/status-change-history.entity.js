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
exports.StatusChangeHistory = exports.EntityType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var EntityType;
(function (EntityType) {
    EntityType["TRAINING_NEED"] = "training_need";
    EntityType["COURSE_PROJECT"] = "course_project";
    EntityType["STUDENT"] = "student";
})(EntityType || (exports.EntityType = EntityType = {}));
let StatusChangeHistory = class StatusChangeHistory {
};
exports.StatusChangeHistory = StatusChangeHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', type: 'enum', enum: EntityType }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id' }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_status' }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_status' }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'changed_by_id' }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "changedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'changed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], StatusChangeHistory.prototype, "changedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StatusChangeHistory.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StatusChangeHistory.prototype, "createdAt", void 0);
exports.StatusChangeHistory = StatusChangeHistory = __decorate([
    (0, typeorm_1.Entity)('status_change_history')
], StatusChangeHistory);
//# sourceMappingURL=status-change-history.entity.js.map