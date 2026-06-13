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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
const notification_entity_1 = require("../../entities/notification.entity");
const notification_log_entity_1 = require("../../entities/notification-log.entity");
let NotificationService = class NotificationService {
    constructor(notificationRepository, notificationLogRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.logDir = 'logs/notifications';
        this.ensureLogDir();
    }
    ensureLogDir() {
        const dir = path.join(process.cwd(), this.logDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    async sendNotification(type, recipientId, title, content, relatedEntityType, relatedEntityId) {
        const notification = this.notificationRepository.create({
            type,
            recipientId,
            title,
            content,
            relatedEntityType,
            relatedEntityId,
        });
        await this.notificationRepository.save(notification);
        const triggerResult = await this.triggerNotification(notification);
        await this.logNotification(notification, triggerResult);
    }
    async triggerNotification(notification) {
        try {
            console.log(`[Notification] ${notification.type} sent to ${notification.recipientId}`);
            return { result: 'success' };
        }
        catch (error) {
            return { result: 'failed', error: error.message };
        }
    }
    async logNotification(notification, triggerResult) {
        const today = dayjs().format('YYYY-MM-DD');
        const logFileName = `${today}.json`;
        const logFilePath = path.join(process.cwd(), this.logDir, logFileName);
        const notificationLog = this.notificationLogRepository.create({
            notificationId: notification.id,
            triggerTime: new Date(),
            triggerResult: triggerResult.result,
            errorMessage: triggerResult.error,
            logFilePath,
        });
        await this.notificationLogRepository.save(notificationLog);
        const logEntry = {
            id: notificationLog.id,
            notificationId: notification.id,
            triggerTime: notificationLog.triggerTime,
            triggerResult: notificationLog.triggerResult,
            errorMessage: notificationLog.errorMessage,
            recipient: {
                id: notification.recipientId,
            },
            notification: {
                type: notification.type,
                title: notification.title,
                content: notification.content,
            },
        };
        let logs = [];
        if (fs.existsSync(logFilePath)) {
            const fileContent = fs.readFileSync(logFilePath, 'utf-8');
            logs = JSON.parse(fileContent);
        }
        logs.push(logEntry);
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    }
    async findAll(page = 1, pageSize = 10, type, isRead) {
        const query = this.notificationRepository
            .createQueryBuilder('n')
            .leftJoinAndSelect('n.recipient', 'recipient');
        if (type) {
            query.andWhere('n.type = :type', { type });
        }
        if (isRead !== undefined) {
            query.andWhere('n.is_read = :isRead', { isRead });
        }
        query.orderBy('n.createdAt', 'DESC');
        const [items, total] = await query
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items: items.map((item) => ({
                id: item.id,
                type: item.type,
                recipient: {
                    id: item.recipient.id,
                    name: item.recipient.name,
                },
                title: item.title,
                content: item.content,
                relatedEntity: {
                    type: item.relatedEntityType,
                    id: item.relatedEntityId,
                },
                isRead: item.isRead,
                createdAt: item.createdAt,
            })),
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        const notification = await this.notificationRepository.findOne({
            where: { id },
            relations: ['recipient'],
        });
        if (!notification) {
            return null;
        }
        return {
            id: notification.id,
            type: notification.type,
            recipient: {
                id: notification.recipient.id,
                name: notification.recipient.name,
            },
            title: notification.title,
            content: notification.content,
            relatedEntity: {
                type: notification.relatedEntityType,
                id: notification.relatedEntityId,
            },
            isRead: notification.isRead,
            createdAt: notification.createdAt,
        };
    }
    async markAsRead(id) {
        await this.notificationRepository.update(id, { isRead: true });
    }
    async getLogs(page = 1, pageSize = 10) {
        const query = this.notificationLogRepository
            .createQueryBuilder('nl')
            .leftJoinAndSelect('nl.notification', 'notification')
            .leftJoinAndSelect('notification.recipient', 'recipient')
            .orderBy('nl.createdAt', 'DESC');
        const [items, total] = await query
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return {
            items: items.map((item) => ({
                id: item.id,
                notification: {
                    id: item.notification.id,
                    type: item.notification.type,
                    title: item.notification.title,
                    recipient: {
                        id: item.notification.recipient.id,
                        name: item.notification.recipient.name,
                    },
                },
                triggerTime: item.triggerTime,
                triggerResult: item.triggerResult,
                errorMessage: item.errorMessage,
                logFilePath: item.logFilePath,
                createdAt: item.createdAt,
            })),
            total,
            page,
            pageSize,
        };
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_log_entity_1.NotificationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationService);
//# sourceMappingURL=notifications.service.js.map