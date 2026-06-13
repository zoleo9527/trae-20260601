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
exports.Notification = exports.NotificationType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var NotificationType;
(function (NotificationType) {
    NotificationType["TRAINING_NEED_APPROVED"] = "training_need_approved";
    NotificationType["TRAINING_NEED_REJECTED"] = "training_need_rejected";
    NotificationType["TRAINING_NEED_TRANSFERRED"] = "training_need_transferred";
    NotificationType["COURSE_PROJECT_APPROVED"] = "course_project_approved";
    NotificationType["COURSE_PROJECT_REJECTED"] = "course_project_rejected";
    NotificationType["COURSE_REMINDER"] = "course_reminder";
    NotificationType["ASSIGNMENT_REMINDER"] = "assignment_reminder";
    NotificationType["CERTIFICATE_ISSUED"] = "certificate_issued";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let Notification = class Notification {
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: NotificationType,
    }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_id' }),
    __metadata("design:type", String)
], Notification.prototype, "recipientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'recipient_id' }),
    __metadata("design:type", user_entity_1.User)
], Notification.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Notification.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'related_entity_type', nullable: true }),
    __metadata("design:type", String)
], Notification.prototype, "relatedEntityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'related_entity_id', nullable: true }),
    __metadata("design:type", String)
], Notification.prototype, "relatedEntityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_read', default: false }),
    __metadata("design:type", Boolean)
], Notification.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Notification.prototype, "createdAt", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)('notification')
], Notification);
//# sourceMappingURL=notification.entity.js.map