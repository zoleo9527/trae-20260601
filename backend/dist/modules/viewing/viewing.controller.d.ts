import { ViewingService, ViewingFilters } from './viewing.service';
export declare class ViewingController {
    private readonly viewingService;
    constructor(viewingService: ViewingService);
    create(body: any, user: any): import("./viewing.service").Viewing;
    findAll(filters: ViewingFilters): import("./viewing.service").Viewing[];
    getPropertyViewingSummary(propertyId: string): import("./viewing.service").PropertyViewingSummary;
    findOne(id: string): import("./viewing.service").Viewing;
    addFeedback(id: string, body: any, user: any): import("./viewing.service").Viewing;
}
