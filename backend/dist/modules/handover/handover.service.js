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
exports.HandoverService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const audit_service_1 = require("../audit/audit.service");
const property_service_1 = require("../property/property.service");
const DEFAULT_CHECKLIST_ITEMS = [
    '门窗完好',
    '水电正常',
    '空调设备正常',
    '墙面地面无破损',
    '消防设施完好',
    '网络线路正常',
    '卫生清洁完成',
];
let HandoverService = class HandoverService {
    constructor(auditService, propertyService) {
        this.auditService = auditService;
        this.propertyService = propertyService;
        this.handovers = [];
    }
    submit(data, userId, userName, userRole) {
        const property = this.propertyService.findOne(data.propertyId);
        if (property.status !== 'leased' && property.status !== 'handover_pending') {
            throw new common_1.BadRequestException('房源状态不允许提交交房验收，当前状态: ' + property.status);
        }
        const checklist = data.checklist
            ? data.checklist
            : DEFAULT_CHECKLIST_ITEMS.map((item) => ({ item, status: 'na' }));
        const handover = {
            id: (0, uuid_1.v4)(),
            propertyId: data.propertyId,
            submittedBy: userId,
            submittedByName: userName,
            submittedAt: new Date(),
            checklist,
            issues: data.issues ?? [],
            status: 'pending',
        };
        this.propertyService.updateStatus(data.propertyId, 'handover_pending', userId, userName, userRole);
        this.handovers.push(handover);
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'submit',
            entity: 'handover',
            entityId: handover.id,
            after: handover,
        });
        return handover;
    }
    confirm(id, userId, userName, userRole) {
        const handover = this.handovers.find((h) => h.id === id);
        if (!handover) {
            throw new common_1.NotFoundException('交房验收记录不存在');
        }
        if (handover.status !== 'pending') {
            throw new common_1.BadRequestException('只能确认待处理状态的交房验收');
        }
        const before = { ...handover };
        handover.status = 'confirmed';
        handover.confirmedBy = userId;
        handover.confirmedByName = userName;
        handover.confirmedAt = new Date();
        this.propertyService.updateStatus(handover.propertyId, 'handover_accepted', userId, userName, userRole);
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'confirm',
            entity: 'handover',
            entityId: handover.id,
            before,
            after: handover,
        });
        return handover;
    }
    dispute(id, data, userId, userName, userRole) {
        const handover = this.handovers.find((h) => h.id === id);
        if (!handover) {
            throw new common_1.NotFoundException('交房验收记录不存在');
        }
        if (handover.status !== 'pending') {
            throw new common_1.BadRequestException('只能对待处理状态的交房验收提出异议');
        }
        const before = { ...handover };
        handover.status = 'disputed';
        handover.dispute = {
            reason: data.reason,
            disputedItems: data.disputedItems,
            raisedAt: new Date(),
            raisedBy: userId,
            raisedByName: userName,
        };
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'dispute',
            entity: 'handover',
            entityId: handover.id,
            before,
            after: handover,
        });
        return handover;
    }
    resolve(id, resolution, userId, userName, userRole) {
        const handover = this.handovers.find((h) => h.id === id);
        if (!handover) {
            throw new common_1.NotFoundException('交房验收记录不存在');
        }
        if (handover.status !== 'disputed') {
            throw new common_1.BadRequestException('只能解决异议状态的交房验收');
        }
        const before = { ...handover };
        handover.status = 'pending';
        handover.resolution = resolution;
        handover.resolvedAt = new Date();
        handover.resolvedBy = userId;
        handover.resolvedByName = userName;
        this.auditService.log({
            userId,
            userName,
            userRole,
            action: 'resolve',
            entity: 'handover',
            entityId: handover.id,
            before,
            after: handover,
        });
        return handover;
    }
    findAll(filters) {
        let result = [...this.handovers];
        if (filters?.propertyId) {
            result = result.filter((h) => h.propertyId === filters.propertyId);
        }
        if (filters?.status) {
            result = result.filter((h) => h.status === filters.status);
        }
        if (filters?.submittedBy) {
            result = result.filter((h) => h.submittedBy === filters.submittedBy);
        }
        result.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        return result;
    }
    findOne(id) {
        const handover = this.handovers.find((h) => h.id === id);
        if (!handover) {
            throw new common_1.NotFoundException('交房验收记录不存在');
        }
        return handover;
    }
    getDisputes() {
        return this.handovers
            .filter((h) => h.status === 'disputed')
            .sort((a, b) => b.dispute.raisedAt.getTime() - a.dispute.raisedAt.getTime());
    }
    getAuditTrail(id) {
        this.findOne(id);
        return this.auditService.getByEntity('handover', id);
    }
};
exports.HandoverService = HandoverService;
exports.HandoverService = HandoverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        property_service_1.PropertyService])
], HandoverService);
//# sourceMappingURL=handover.service.js.map