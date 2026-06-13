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
exports.StatusChangeHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const status_change_history_entity_1 = require("../../entities/status-change-history.entity");
const user_entity_1 = require("../../entities/user.entity");
let StatusChangeHistoryService = class StatusChangeHistoryService {
    constructor(historyRepository, userRepository) {
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }
    async recordStatusChange(entityType, entityId, fromStatus, toStatus, changedById, reason, remarks) {
        const history = this.historyRepository.create({
            entityType,
            entityId,
            fromStatus,
            toStatus,
            changedById,
            reason,
            remarks,
        });
        return await this.historyRepository.save(history);
    }
    async getHistoryByEntity(entityType, entityId) {
        const histories = await this.historyRepository.find({
            where: { entityType, entityId },
            relations: ['changedBy'],
            order: { createdAt: 'ASC' },
        });
        return histories.map((history) => ({
            id: history.id,
            entityType: history.entityType,
            entityId: history.entityId,
            fromStatus: history.fromStatus,
            toStatus: history.toStatus,
            changedBy: {
                id: history.changedBy.id,
                name: history.changedBy.name,
                role: history.changedBy.role,
            },
            reason: history.reason,
            remarks: history.remarks,
            createdAt: history.createdAt,
        }));
    }
    async getLatestStatusChange(entityType, entityId) {
        return await this.historyRepository.findOne({
            where: { entityType, entityId },
            relations: ['changedBy'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.StatusChangeHistoryService = StatusChangeHistoryService;
exports.StatusChangeHistoryService = StatusChangeHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(status_change_history_entity_1.StatusChangeHistory)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StatusChangeHistoryService);
//# sourceMappingURL=status-history.service.js.map