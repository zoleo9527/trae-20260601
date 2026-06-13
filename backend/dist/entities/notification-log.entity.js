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
exports.NotificationLog = void 0;
const typeorm_1 = require("typeorm");
const notification_entity_1 = require("./notification.entity");
let NotificationLog = class NotificationLog {
};
exports.NotificationLog = NotificationLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NotificationLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notification_id' }),
    __metadata("design:type", String)
], NotificationLog.prototype, "notificationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => notification_entity_1.Notification),
    (0, typeorm_1.JoinColumn)({ name: 'notification_id' }),
    __metadata("design:type", notification_entity_1.Notification)
], NotificationLog.prototype, "notification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', name: 'trigger_time', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], NotificationLog.prototype, "triggerTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trigger_result' }),
    __metadata("design:type", String)
], NotificationLog.prototype, "triggerResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'error_message', nullable: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'log_file_path', nullable: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "logFilePath", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NotificationLog.prototype, "createdAt", void 0);
exports.NotificationLog = NotificationLog = __decorate([
    (0, typeorm_1.Entity)('notification_log')
], NotificationLog);
//# sourceMappingURL=notification-log.entity.js.map