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
exports.TrainingNeed = exports.Urgency = exports.TrainingNeedStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const training_need_remark_entity_1 = require("./training-need-remark.entity");
var TrainingNeedStatus;
(function (TrainingNeedStatus) {
    TrainingNeedStatus["PENDING"] = "pending";
    TrainingNeedStatus["APPROVED"] = "approved";
    TrainingNeedStatus["REJECTED"] = "rejected";
    TrainingNeedStatus["TRANSFERRED"] = "transferred";
})(TrainingNeedStatus || (exports.TrainingNeedStatus = TrainingNeedStatus = {}));
var Urgency;
(function (Urgency) {
    Urgency["LOW"] = "low";
    Urgency["MEDIUM"] = "medium";
    Urgency["HIGH"] = "high";
})(Urgency || (exports.Urgency = Urgency = {}));
let TrainingNeed = class TrainingNeed {
};
exports.TrainingNeed = TrainingNeed;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrainingNeed.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrainingNeed.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TrainingNeed.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TrainingNeed.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submitter_id' }),
    __metadata("design:type", String)
], TrainingNeed.prototype, "submitterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'submitter_id' }),
    __metadata("design:type", user_entity_1.User)
], TrainingNeed.prototype, "submitter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_handler_id', nullable: true }),
    __metadata("design:type", String)
], TrainingNeed.prototype, "currentHandlerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'current_handler_id' }),
    __metadata("design:type", user_entity_1.User)
], TrainingNeed.prototype, "currentHandler", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'expected_date' }),
    __metadata("design:type", Date)
], TrainingNeed.prototype, "expectedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'participant_count', default: 0 }),
    __metadata("design:type", Number)
], TrainingNeed.prototype, "participantCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TrainingNeed.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Urgency,
        default: Urgency.MEDIUM,
    }),
    __metadata("design:type", String)
], TrainingNeed.prototype, "urgency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TrainingNeedStatus,
        default: TrainingNeedStatus.PENDING,
    }),
    __metadata("design:type", String)
], TrainingNeed.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TrainingNeed.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => training_need_remark_entity_1.TrainingNeedRemark, (remark) => remark.trainingNeed),
    __metadata("design:type", Array)
], TrainingNeed.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TrainingNeed.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TrainingNeed.prototype, "updatedAt", void 0);
exports.TrainingNeed = TrainingNeed = __decorate([
    (0, typeorm_1.Entity)('training_need')
], TrainingNeed);
//# sourceMappingURL=training-need.entity.js.map