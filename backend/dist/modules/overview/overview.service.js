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
exports.OverviewService = void 0;
const common_1 = require("@nestjs/common");
const handover_service_1 = require("../handover/handover.service");
const deposit_service_1 = require("../deposit/deposit.service");
const key_transfer_service_1 = require("../key-transfer/key-transfer.service");
const property_service_1 = require("../property/property.service");
const viewing_service_1 = require("../viewing/viewing.service");
let OverviewService = class OverviewService {
    constructor(handoverService, depositService, keyTransferService, propertyService, viewingService) {
        this.handoverService = handoverService;
        this.depositService = depositService;
        this.keyTransferService = keyTransferService;
        this.propertyService = propertyService;
        this.viewingService = viewingService;
    }
    getDisputeOverview() {
        const allHandovers = this.handoverService.findAll();
        const allDeposits = this.depositService.findAll();
        const allKeyTransfers = this.keyTransferService.findAll();
        const allProperties = this.propertyService.findAll();
        const allViewings = this.viewingService.findAll();
        const handoverDisputes = allHandovers.filter((h) => h.status === 'disputed');
        const depositDisputes = allDeposits.filter((d) => d.status === 'disputed');
        const pendingKeyTransfers = allKeyTransfers.filter((k) => k.status === 'pending_transfer');
        const staleProperties = allProperties.filter((p) => {
            if (p.status === 'leased') {
                const propViewings = allViewings.filter((v) => v.propertyId === p.id && v.feedback);
                return propViewings.length > 0;
            }
            if (p.status === 'viewing') {
                const daysSinceView = this._getDaysSinceLastViewing(p.id, allViewings);
                return daysSinceView > 7;
            }
            return false;
        });
        const viewingsWithoutFeedback = allViewings.filter((v) => !v.feedback);
        const handoverFlow = {
            pendingCount: allHandovers.filter((h) => h.status === 'pending').length,
            confirmedCount: allHandovers.filter((h) => h.status === 'confirmed').length,
            disputedCount: handoverDisputes.length,
            resolvedCount: allHandovers.filter((h) => h.status === 'resolved').length,
        };
        const depositFlow = {
            pendingCount: allDeposits.filter((d) => d.status === 'pending').length,
            confirmedCount: allDeposits.filter((d) => d.status === 'confirmed').length,
            disputedCount: depositDisputes.length,
            settledCount: allDeposits.filter((d) => d.status === 'settled').length,
        };
        return {
            summary: {
                totalDisputes: handoverDisputes.length + depositDisputes.length,
                handoverDisputes: handoverDisputes.length,
                depositDisputes: depositDisputes.length,
                pendingKeyTransfers: pendingKeyTransfers.length,
                propertiesWithStaleStatus: staleProperties.length,
                viewingsWithoutFeedback: viewingsWithoutFeedback.length,
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
                pendingDays: this._getDaysDiff(k.transferredAt),
            })),
            staleProperties: staleProperties.map((p) => ({
                id: p.id,
                building: p.building,
                floor: p.floor,
                unit: p.unit,
                area: p.area,
                status: p.status,
                currentTenant: p.currentTenant,
                updatedAt: p.updatedAt,
                staleReason: this._getStaleReason(p, allViewings),
            })),
            viewingsWithoutFeedback: viewingsWithoutFeedback.map((v) => ({
                id: v.id,
                propertyId: v.propertyId,
                viewerName: v.viewerName,
                viewerCompany: v.viewerCompany,
                viewDate: v.viewDate,
                consultantName: v.consultantName,
                daysSinceView: this._getDaysDiff(v.viewDate),
            })),
            handoverFlow,
            depositFlow,
        };
    }
    getRoleDashboard(role) {
        const overview = this.getDisputeOverview();
        if (role === 'consultant') {
            return {
                myActions: {
                    pendingHandovers: overview.handoverFlow.pendingCount,
                    viewingsWithoutFeedback: overview.summary.viewingsWithoutFeedback,
                    pendingKeyInitiations: overview.summary.pendingKeyTransfers,
                },
                alerts: [
                    ...overview.viewingsWithoutFeedback.slice(0, 5).map((v) => ({
                        type: 'viewing_no_feedback',
                        priority: 'warning',
                        message: `看房记录无反馈: ${v.viewerName} - ${v.viewerCompany}`,
                        data: v,
                    })),
                    ...overview.pendingKeyTransfers.slice(0, 3).map((k) => ({
                        type: 'key_transfer_pending',
                        priority: 'info',
                        message: `钥匙移交待接收: ${k.keyCount} 把钥匙`,
                        data: k,
                    })),
                ],
            };
        }
        if (role === 'operations') {
            return {
                myActions: {
                    pendingHandovers: overview.handoverFlow.pendingCount,
                    handoverDisputes: overview.summary.handoverDisputes,
                    pendingKeyReceptions: overview.summary.pendingKeyTransfers,
                    staleProperties: overview.summary.propertiesWithStaleStatus,
                },
                alerts: [
                    ...overview.handoverDisputes.slice(0, 5).map((h) => ({
                        type: 'handover_dispute',
                        priority: 'high',
                        message: `交房验收争议: ${h.disputeReason}`,
                        data: h,
                    })),
                    ...overview.staleProperties.slice(0, 3).map((p) => ({
                        type: 'stale_status',
                        priority: 'warning',
                        message: `房源状态滞后: ${p.building} ${p.floor}层${p.unit}`,
                        data: p,
                    })),
                ],
            };
        }
        if (role === 'finance') {
            return {
                myActions: {
                    pendingDeposits: overview.depositFlow.pendingCount,
                    depositDisputes: overview.summary.depositDisputes,
                },
                alerts: [
                    ...overview.depositDisputes.slice(0, 5).map((d) => ({
                        type: 'deposit_dispute',
                        priority: 'high',
                        message: `押金争议: ¥${d.disputedAmount} - ${d.disputeReason}`,
                        data: d,
                    })),
                ],
            };
        }
        return overview;
    }
    _getDaysSinceLastViewing(propertyId, viewings) {
        const propViewings = viewings.filter((v) => v.propertyId === propertyId);
        if (propViewings.length === 0)
            return 0;
        const latest = propViewings.sort((a, b) => b.viewDate.getTime() - a.viewDate.getTime())[0];
        return this._getDaysDiff(latest.viewDate);
    }
    _getDaysDiff(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    _getStaleReason(property, viewings) {
        if (property.status === 'viewing') {
            const days = this._getDaysSinceLastViewing(property.id, viewings);
            return `看房状态已 ${days} 天无更新`;
        }
        if (property.status === 'leased') {
            const hasViewings = viewings.filter((v) => v.propertyId === property.id && v.feedback).length;
            return `已签约但有 ${hasViewings} 条带反馈看房记录，状态未及时清理`;
        }
        return '状态更新滞后';
    }
};
exports.OverviewService = OverviewService;
exports.OverviewService = OverviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [handover_service_1.HandoverService,
        deposit_service_1.DepositService,
        key_transfer_service_1.KeyTransferService,
        property_service_1.PropertyService,
        viewing_service_1.ViewingService])
], OverviewService);
//# sourceMappingURL=overview.service.js.map