import { AuditService } from '../audit/audit.service';
export interface Property {
    id: string;
    building: string;
    floor: number;
    unit: string;
    area: number;
    status: string;
    rentPrice: number;
    deposit: number;
    currentTenant?: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreatePropertyData {
    building: string;
    floor: number;
    unit: string;
    area: number;
    rentPrice: number;
    deposit: number;
    currentTenant?: string;
    description?: string;
}
export interface PropertyFilters {
    status?: string;
    building?: string;
    floor?: number;
}
export declare class PropertyService {
    private readonly auditService;
    private readonly properties;
    constructor(auditService: AuditService);
    findAll(filters?: PropertyFilters): Property[];
    findOne(id: string): Property;
    create(data: CreatePropertyData, userId: string, userName: string, userRole: string): Property;
    updateStatus(id: string, newStatus: string, userId: string, userName: string, userRole: string): Property;
    getStatusHistory(id: string): import("../audit/audit.service").AuditLogEntry[];
}
