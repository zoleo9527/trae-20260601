import { Injectable } from '@nestjs/common';
import { HandoverService } from '../handover/handover.service';
import { DepositService } from '../deposit/deposit.service';
import { KeyTransferService } from '../key-transfer/key-transfer.service';
import { PropertyService } from '../property/property.service';
import { ViewingService } from '../viewing/viewing.service';

export interface DisputeOverview {
  summary: {
    totalDisputes: number;
    handoverDisputes: number;
    depositDisputes: number;
    pendingKeyTransfers: number;
    propertiesWithStaleStatus: number;
    viewingsWithoutFeedback: number;
  };
  handoverDisputes: any[];
  depositDisputes: any[];
  pendingKeyTransfers: any[];
  staleProperties: any[];
  viewingsWithoutFeedback: any[];
  handoverFlow: {
    pendingCount: number;
    confirmedCount: number;
    disputedCount: number;
    resolvedCount: number;
  };
  depositFlow: {
    pendingCount: number;
    confirmedCount: number;
    disputedCount: number;
    settledCount: number;
  };
}

@Injectable()
export class OverviewService {
  constructor(
    private readonly handoverService: HandoverService,
    private readonly depositService: DepositService,
    private readonly keyTransferService: KeyTransferService,
    private readonly propertyService: PropertyService,
    private readonly viewingService: ViewingService,
  ) {}

  getDisputeOverview(): DisputeOverview {
    const allHandovers = this.handoverService.findAll();
    const allDeposits = this.depositService.findAll();
    const allKeyTransfers = this.keyTransferService.findAll();
    const allProperties = this.propertyService.findAll();
    const allViewings = this.viewingService.findAll();

    const handoverDisputes = allHandovers.filter((h) => h.status === 'disputed');
    const depositDisputes = allDeposits.filter((d) => d.status === 'disputed');
    const pendingKeyTransfers = allKeyTransfers.filter(
      (k) => k.status === 'pending_transfer',
    );

    const staleProperties = allProperties.filter((p) => {
      if (p.status === 'leased') {
        const propViewings = allViewings.filter(
          (v) => v.propertyId === p.id && v.feedback,
        );
        return propViewings.length > 0;
      }
      if (p.status === 'viewing') {
        const daysSinceView = this._getDaysSinceLastViewing(p.id, allViewings);
        return daysSinceView > 7;
      }
      return false;
    });

    const viewingsWithoutFeedback = allViewings.filter(
      (v) => !v.feedback,
    );

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

  getRoleDashboard(role: string): any {
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

  private _getDaysSinceLastViewing(propertyId: string, viewings: any[]): number {
    const propViewings = viewings.filter((v) => v.propertyId === propertyId);
    if (propViewings.length === 0) return 0;
    const latest = propViewings.sort(
      (a, b) => b.viewDate.getTime() - a.viewDate.getTime(),
    )[0];
    return this._getDaysDiff(latest.viewDate);
  }

  private _getDaysDiff(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private _getStaleReason(property: any, viewings: any[]): string {
    if (property.status === 'viewing') {
      const days = this._getDaysSinceLastViewing(property.id, viewings);
      return `看房状态已 ${days} 天无更新`;
    }
    if (property.status === 'leased') {
      const hasViewings = viewings.filter(
        (v) => v.propertyId === property.id && v.feedback,
      ).length;
      return `已签约但有 ${hasViewings} 条带反馈看房记录，状态未及时清理`;
    }
    return '状态更新滞后';
  }
}
