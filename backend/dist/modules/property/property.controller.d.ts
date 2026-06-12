import { PropertyService, PropertyFilters, CreatePropertyData } from './property.service';
export declare class PropertyController {
    private readonly propertyService;
    constructor(propertyService: PropertyService);
    findAll(filters: PropertyFilters): import("./property.service").Property[];
    findOne(id: string): import("./property.service").Property;
    create(data: CreatePropertyData, user: any): import("./property.service").Property;
    updateStatus(id: string, status: string, user: any): import("./property.service").Property;
    getStatusHistory(id: string): import("../audit/audit.service").AuditLogEntry[];
}
