"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let AuditService = class AuditService {
    constructor() {
        this.entries = [];
    }
    log(entry) {
        const record = {
            id: (0, uuid_1.v4)(),
            userId: entry.userId,
            userName: entry.userName,
            userRole: entry.userRole,
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId,
            before: entry.before ?? null,
            after: entry.after ?? null,
            timestamp: new Date(),
            ip: entry.ip,
        };
        this.entries.push(record);
        return record;
    }
    query(filters) {
        let result = [...this.entries];
        if (filters?.userId) {
            result = result.filter((e) => e.userId === filters.userId);
        }
        if (filters?.entity) {
            result = result.filter((e) => e.entity === filters.entity);
        }
        if (filters?.entityId) {
            result = result.filter((e) => e.entityId === filters.entityId);
        }
        if (filters?.action) {
            result = result.filter((e) => e.action === filters.action);
        }
        if (filters?.from) {
            const fromDate = new Date(filters.from);
            result = result.filter((e) => e.timestamp >= fromDate);
        }
        if (filters?.to) {
            const toDate = new Date(filters.to);
            result = result.filter((e) => e.timestamp <= toDate);
        }
        result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return result;
    }
    getByEntity(entity, entityId) {
        return this.entries
            .filter((e) => e.entity === entity && e.entityId === entityId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getRecent(limit = 50) {
        return [...this.entries]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    getDisputesOverview(handoverDisputes, depositDisputes, pendingKeyTransfers) {
        return {
            summary: {
                totalDisputes: handoverDisputes.length + depositDisputes.length,
                handoverDisputes: handoverDisputes.length,
                depositDisputes: depositDisputes.length,
                pendingKeyTransfers: pendingKeyTransfers.length,
            },
            handoverDisputes: handoverDisputes.map((h) => ({
                id: h.id,
                propertyId: h.propertyId,
                status: h.status,
                submittedBy: h.submittedByName,
                submittedAt: h.submittedAt,
                disputeReason: h.dispute?.reason,
                disputedItems: h.dispute?.disputedItems,
                raisedBy: h.dispute?.raisedByName,
                raisedAt: h.dispute?.raisedAt,
            })),
            depositDisputes: depositDisputes.map((d) => ({
                id: d.id,
                propertyId: d.propertyId,
                tenantName: d.tenantName,
                originalDeposit: d.originalDeposit,
                refundAmount: d.refundAmount,
                disputedAmount: d.dispute?.disputedAmount,
                disputeReason: d.dispute?.disputeReason,
                disputedItems: d.dispute?.deductionItems,
                raisedBy: d.dispute?.raisedByName,
                raisedAt: d.dispute?.raisedAt,
            })),
            pendingKeyTransfers: pendingKeyTransfers.map((k) => ({
                id: k.id,
                propertyId: k.propertyId,
                handoverId: k.handoverId,
                keyCount: k.keyCount,
                keyTypes: k.keyTypes,
                initiatedBy: k.transferredByName,
                initiatedAt: k.transferredAt,
                status: k.status,
            })),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)()
], AuditService);
//# sourceMappingURL=audit.service.js.map