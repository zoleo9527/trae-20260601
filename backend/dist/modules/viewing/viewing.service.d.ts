import { AuditService } from '../audit/audit.service';
export interface ViewingFeedback {
    satisfaction: 'satisfied' | 'neutral' | 'unsatisfied';
    notes: string;
    followUpAction?: string;
    submittedAt: Date;
}
export interface Viewing {
    id: string;
    propertyId: string;
    consultantId: string;
    consultantName: string;
    viewerName: string;
    viewerCompany: string;
    viewerContact: string;
    viewDate: Date;
    feedback?: ViewingFeedback;
    createdAt: Date;
}
export interface ViewingFilters {
    propertyId?: string;
    consultantId?: string;
    feedback?: string;
    from?: string;
    to?: string;
}
export interface PropertyViewingSummary {
    totalViewings: number;
    satisfiedCount: number;
    unsatisfiedCount: number;
    neutralCount: number;
    latestFeedback: ViewingFeedback | null;
}
export declare class ViewingService {
    private readonly auditService;
    private readonly viewings;
    constructor(auditService: AuditService);
    create(data: Omit<Viewing, 'id' | 'createdAt'>, userId: string, userName: string, userRole: string): Viewing;
    findAll(filters?: ViewingFilters): Viewing[];
    findOne(id: string): Viewing;
    addFeedback(id: string, feedback: {
        satisfaction: 'satisfied' | 'neutral' | 'unsatisfied';
        notes: string;
        followUpAction?: string;
    }, userId: string, userName: string, userRole: string): Viewing;
    getPropertyViewingSummary(propertyId: string): PropertyViewingSummary;
}
