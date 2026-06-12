import { OverviewService } from './overview.service';
export declare class OverviewController {
    private readonly overviewService;
    constructor(overviewService: OverviewService);
    getDisputeOverview(): import("./overview.service").DisputeOverview;
    getRoleDashboard(user: any): any;
}
