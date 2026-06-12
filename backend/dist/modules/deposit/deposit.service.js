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
exports.DepositService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const audit_service_1 = require("../audit/audit.service");
const property_service_1 = require("../property/property.service");
let DepositService = class DepositService {
    constructor(auditService, propertyService) {
        this.auditService = auditService;
        this.propertyService = propertyService;
        this.deposits = [];
    }
    initiate(data, userId, userName, userRole) {
        this.propertyService.findOne(data.propertyId);
        const totalDeductions = data.deductions.reduce((sum, d) => sum + d.amount, 0);
        const refundAmount = data.originalDeposit - totalDeductions;
        const deposit = {
            id: (0, uuid_1.v4)(),
            propertyId: data.propertyId,
            handoverId: data.handoverId,
            tenantName: data.tenantName,
            originalDeposit: data.originalDeposit,
            deductions: data.deductions,
            totalDeductions,
            refundAmount,
            status: 'pending',
            initiatedBy: userId,
            initiatedByName: userName,
            initiatedAt: new Date(),
        };
        this.deposits.push(deposit);
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'initiate',
            entity: 'deposit',
            entityId: deposit.id,
            after: { ...deposit },
        });
        return deposit;
    }
    confirm(id, userId, userName, userRole) {
        const deposit = this.findOne(id);
        if (deposit.status !== 'pending') {
            throw new common_1.BadRequestException(`押金记录状态为 "${deposit.status}"，无法确认`);
        }
        const before = { ...deposit };
        deposit.status = 'confirmed';
        deposit.confirmedBy = userId;
        deposit.confirmedByName = userName;
        deposit.confirmedAt = new Date();
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'confirm',
            entity: 'deposit',
            entityId: deposit.id,
            before: { status: before.status },
            after: { status: deposit.status, confirmedBy: userId, confirmedByName: userName, confirmedAt: deposit.confirmedAt },
        });
        return deposit;
    }
    dispute(id, data, userId, userName, userRole) {
        const deposit = this.findOne(id);
        if (deposit.status !== 'pending' && deposit.status !== 'confirmed') {
            throw new common_1.BadRequestException(`押金记录状态为 "${deposit.status}"，无法提出异议`);
        }
        const before = { ...deposit };
        deposit.status = 'disputed';
        deposit.dispute = {
            disputeReason: data.disputeReason,
            disputedAmount: data.disputedAmount,
            deductionItems: data.deductionItems,
            raisedAt: new Date(),
            raisedBy: userId,
            raisedByName: userName,
        };
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'dispute',
            entity: 'deposit',
            entityId: deposit.id,
            before: { status: before.status },
            after: {
                status: deposit.status,
                dispute: deposit.dispute,
            },
        });
        return deposit;
    }
    resolve(id, resolution, userId, userName, userRole) {
        const deposit = this.findOne(id);
        if (deposit.status !== 'disputed') {
            throw new common_1.BadRequestException(`押金记录状态为 "${deposit.status}"，无法解决异议`);
        }
        const before = { ...deposit };
        deposit.status = 'settled';
        deposit.resolution = {
            finalAmount: resolution.finalAmount,
            resolutionNotes: resolution.resolutionNotes,
            resolvedAt: new Date(),
            resolvedBy: userId,
            resolvedByName: userName,
        };
        deposit.refundAmount = resolution.finalAmount;
        deposit.settledAt = new Date();
        deposit.settledBy = userId;
        deposit.settledByName = userName;
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'resolve',
            entity: 'deposit',
            entityId: deposit.id,
            before: { status: before.status },
            after: {
                status: deposit.status,
                resolution: deposit.resolution,
                refundAmount: deposit.refundAmount,
                settledAt: deposit.settledAt,
                settledBy: deposit.settledBy,
                settledByName: deposit.settledByName,
            },
        });
        return deposit;
    }
    markSettled(id, userId, userName, userRole) {
        const deposit = this.findOne(id);
        if (deposit.status !== 'confirmed') {
            throw new common_1.BadRequestException(`押金记录状态为 "${deposit.status}"，无法标记为已结算`);
        }
        const before = { ...deposit };
        deposit.status = 'settled';
        deposit.settledAt = new Date();
        deposit.settledBy = userId;
        deposit.settledByName = userName;
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'markSettled',
            entity: 'deposit',
            entityId: deposit.id,
            before: { status: before.status },
            after: {
                status: deposit.status,
                settledAt: deposit.settledAt,
                settledBy: deposit.settledBy,
                settledByName: deposit.settledByName,
            },
        });
        return deposit;
    }
    findAll(filters) {
        let result = [...this.deposits];
        if (filters?.propertyId) {
            result = result.filter((d) => d.propertyId === filters.propertyId);
        }
        if (filters?.status) {
            result = result.filter((d) => d.status === filters.status);
        }
        return result;
    }
    findOne(id) {
        const deposit = this.deposits.find((d) => d.id === id);
        if (!deposit) {
            throw new common_1.NotFoundException(`押金记录 #${id} 未找到`);
        }
        return deposit;
    }
    getDisputes() {
        return this.deposits.filter((d) => d.status === 'disputed');
    }
};
exports.DepositService = DepositService;
exports.DepositService = DepositService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        property_service_1.PropertyService])
], DepositService);
//# sourceMappingURL=deposit.service.js.map