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
exports.TrainingNeedRemark = exports.RemarkAction = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const training_need_entity_1 = require("./training-need.entity");
var RemarkAction;
(function (RemarkAction) {
    RemarkAction["APPROVE"] = "approve";
    RemarkAction["REJECT"] = "reject";
    RemarkAction["TRANSFER"] = "transfer";
    RemarkAction["COMMENT"] = "comment";
})(RemarkAction || (exports.RemarkAction = RemarkAction = {}));
let TrainingNeedRemark = class TrainingNeedRemark {
};
exports.TrainingNeedRemark = TrainingNeedRemark;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TrainingNeedRemark.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'training_need_id' }),
    __metadata("design:type", String)
], TrainingNeedRemark.prototype, "trainingNeedId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => training_need_entity_1.TrainingNeed, (need) => need.remarks),
    (0, typeorm_1.JoinColumn)({ name: 'training_need_id' }),
    __metadata("design:type", training_need_entity_1.TrainingNeed)
], TrainingNeedRemark.prototype, "trainingNeed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'handler_id' }),
    __metadata("design:type", String)
], TrainingNeedRemark.prototype, "handlerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'handler_id' }),
    __metadata("design:type", user_entity_1.User)
], TrainingNeedRemark.prototype, "handler", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TrainingNeedRemark.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RemarkAction,
    }),
    __metadata("design:type", String)
], TrainingNeedRemark.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TrainingNeedRemark.prototype, "createdAt", void 0);
exports.TrainingNeedRemark = TrainingNeedRemark = __decorate([
    (0, typeorm_1.Entity)('training_need_remark')
], TrainingNeedRemark);
//# sourceMappingURL=training-need-remark.entity.js.map