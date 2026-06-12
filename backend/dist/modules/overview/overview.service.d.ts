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
export declare class OverviewService {
    private readonly handoverService;
    private readonly depositService;
    private readonly keyTransferService;
    private readonly propertyService;
    private readonly viewingService;
    constructor(handoverService: HandoverService, depositService: DepositService, keyTransferService: KeyTransferService, propertyService: PropertyService, viewingService: ViewingService);
    getDisputeOverview(): DisputeOverview;
    getRoleDashboard(role: string): any;
    private _getDaysSinceLastViewing;
    private _getDaysDiff;
    private _getStaleReason;
}
