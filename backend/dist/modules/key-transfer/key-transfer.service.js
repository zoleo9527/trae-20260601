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
exports.KeyTransferService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const audit_service_1 = require("../audit/audit.service");
const handover_service_1 = require("../handover/handover.service");
const property_service_1 = require("../property/property.service");
let KeyTransferService = class KeyTransferService {
    constructor(auditService, handoverService, propertyService) {
        this.auditService = auditService;
        this.handoverService = handoverService;
        this.propertyService = propertyService;
        this.transfers = [];
    }
    initiateTransfer(data, userId, userName, userRole) {
        let handover;
        try {
            handover = this.handoverService.findOne(data.handoverId);
        }
        catch {
            throw new common_1.BadRequestException('交房验收记录不存在');
        }
        if (handover.status !== 'confirmed') {
            throw new common_1.BadRequestException('只能对已确认的交房验收发起钥匙移交，当前状态: ' + handover.status);
        }
        if (handover.propertyId !== data.propertyId) {
            throw new common_1.BadRequestException('交房验收与房源不匹配');
        }
        const existingTransfer = this.transfers.find((t) => t.handoverId === data.handoverId && t.status !== 'returned');
        if (existingTransfer) {
            throw new common_1.BadRequestException('该交房验收已有进行中的钥匙移交');
        }
        const transfer = {
            id: (0, uuid_1.v4)(),
            propertyId: data.propertyId,
            handoverId: data.handoverId,
            keyCount: data.keyCount,
            keyTypes: data.keyTypes,
            transferredBy: userId,
            transferredByName: userName,
            transferredAt: new Date(),
            status: 'pending_transfer',
        };
        this.transfers.push(transfer);
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'initiate_transfer',
            entity: 'key_transfer',
            entityId: transfer.id,
            after: transfer,
        });
        return transfer;
    }
    confirmReception(id, userId, userName, userRole) {
        const transfer = this.transfers.find((t) => t.id === id);
        if (!transfer) {
            throw new common_1.NotFoundException('钥匙移交记录不存在');
        }
        if (transfer.status !== 'pending_transfer') {
            throw new common_1.BadRequestException('只能确认待接收状态的钥匙移交');
        }
        const before = { ...transfer };
        transfer.status = 'transferred';
        transfer.receivedBy = userId;
        transfer.receivedByName = userName;
        transfer.receivedAt = new Date();
        try {
            this.propertyService.updateStatus(transfer.propertyId, 'occupied', userId, userName, userRole);
        }
        catch (e) {
        }
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'confirm_reception',
            entity: 'key_transfer',
            entityId: transfer.id,
            before,
            after: transfer,
        });
        return transfer;
    }
    returnKeys(id, data, userId, userName, userRole) {
        const transfer = this.transfers.find((t) => t.id === id);
        if (!transfer) {
            throw new common_1.NotFoundException('钥匙移交记录不存在');
        }
        if (transfer.status !== 'transferred') {
            throw new common_1.BadRequestException('只能归还已移交状态的钥匙');
        }
        const before = { ...transfer };
        transfer.status = 'returned';
        transfer.returnedBy = userId;
        transfer.returnedByName = userName;
        transfer.returnedAt = new Date();
        transfer.returnNotes = data.returnNotes;
        try {
            this.propertyService.updateStatus(transfer.propertyId, 'returning', userId, userName, userRole);
        }
        catch (e) {
        }
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'return_keys',
            entity: 'key_transfer',
            entityId: transfer.id,
            before,
            after: transfer,
        });
        return transfer;
    }
    findAll(filters) {
        let result = [...this.transfers];
        if (filters?.propertyId) {
            result = result.filter((t) => t.propertyId === filters.propertyId);
        }
        if (filters?.handoverId) {
            result = result.filter((t) => t.handoverId === filters.handoverId);
        }
        if (filters?.status) {
            result = result.filter((t) => t.status === filters.status);
        }
        result.sort((a, b) => b.transferredAt.getTime() - a.transferredAt.getTime());
        return result;
    }
    findOne(id) {
        const transfer = this.transfers.find((t) => t.id === id);
        if (!transfer) {
            throw new common_1.NotFoundException('钥匙移交记录不存在');
        }
        return transfer;
    }
    getTransferHistory(id) {
        const transfer = this.findOne(id);
        return this.auditService.getByEntity('key_transfer', transfer.id);
    }
    getTransferTimeline(id) {
        const transfer = this.findOne(id);
        const auditLogs = this.auditService.getByEntity('key_transfer', transfer.id);
        const timeline = [];
        timeline.push({
            event: '发起移交',
            eventType: 'initiate',
            timestamp: transfer.transferredAt,
            operator: transfer.transferredByName,
            operatorRole: 'consultant',
            details: {
                keyCount: transfer.keyCount,
                keyTypes: transfer.keyTypes,
            },
            status: 'completed',
        });
        if (transfer.status === 'transferred' || transfer.status === 'returned') {
            timeline.push({
                event: '确认接收',
                eventType: 'receive',
                timestamp: transfer.receivedAt,
                operator: transfer.receivedByName,
                operatorRole: 'operations',
                details: {
                    propertyStatusUpdated: 'occupied',
                },
                status: 'completed',
            });
        }
        else if (transfer.status === 'pending_transfer') {
            timeline.push({
                event: '待接收',
                eventType: 'pending',
                timestamp: null,
                operator: null,
                operatorRole: 'operations',
                details: {
                    expectedAction: '运营经理确认接收',
                },
                status: 'pending',
            });
        }
        if (transfer.status === 'returned') {
            timeline.push({
                event: '钥匙归还',
                eventType: 'return',
                timestamp: transfer.returnedAt,
                operator: transfer.returnedByName,
                operatorRole: 'operations',
                details: {
                    returnNotes: transfer.returnNotes,
                    propertyStatusUpdated: 'returning',
                },
                status: 'completed',
            });
        }
        const auditEvents = auditLogs.map((log) => ({
            event: this._mapActionToEvent(log.action),
            eventType: log.action,
            timestamp: log.timestamp,
            operator: log.userName,
            operatorRole: log.userRole,
            details: log.after,
            status: 'completed',
            fromAudit: true,
        }));
        const combined = [...timeline, ...auditEvents].sort((a, b) => {
            if (!a.timestamp)
                return 1;
            if (!b.timestamp)
                return -1;
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
        return {
            transferId: transfer.id,
            propertyId: transfer.propertyId,
            handoverId: transfer.handoverId,
            currentStatus: transfer.status,
            keyCount: transfer.keyCount,
            keyTypes: transfer.keyTypes,
            timeline: combined,
            transferredBy: transfer.transferredByName,
            transferredAt: transfer.transferredAt,
            receivedBy: transfer.receivedByName,
            receivedAt: transfer.receivedAt,
            returnedBy: transfer.returnedByName,
            returnedAt: transfer.returnedAt,
        };
    }
    getByHandover(handoverId) {
        const transfer = this.transfers.find((t) => t.handoverId === handoverId);
        if (!transfer) {
            throw new common_1.NotFoundException('该交房验收暂无钥匙移交记录');
        }
        return transfer;
    }
    _mapActionToEvent(action) {
        const actionMap = {
            initiate_transfer: '发起移交',
            confirm_reception: '确认接收',
            return_keys: '钥匙归还',
        };
        return actionMap[action] || action;
    }
};
exports.KeyTransferService = KeyTransferService;
exports.KeyTransferService = KeyTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        handover_service_1.HandoverService,
        property_service_1.PropertyService])
], KeyTransferService);
//# sourceMappingURL=key-transfer.service.js.map