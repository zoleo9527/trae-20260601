export type UserRole = 'project_specialist' | 'review_secretary' | 'finance';
export type ProjectStatus = 'draft' | 'arrangement_pending' | 'arrangement_reviewing' | 'arrangement_approved' | 'arrangement_rejected' | 'bidding_pending' | 'bidding_in_progress' | 'bidding_completed' | 'expert_signin_pending' | 'expert_signin_in_progress' | 'expert_signin_completed' | 'evaluation_in_progress' | 'evaluation_completed' | 'archived';
export type ArrangementStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'modified';
export type SigninStatus = 'pending' | 'confirmed' | 'absent' | 'leave' | 'substituted';
export type ExpertStatus = 'available' | 'busy' | 'leave' | 'suspended';
export type ExceptionType = 'arrangement_timeout' | 'expert_absent' | 'expert_late' | 'signin_incomplete' | 'room_conflict' | 'document_missing' | 'financial_issue' | 'other';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionStatus = 'open' | 'processing' | 'resolved' | 'closed';
export type NotificationType = 'reminder' | 'warning' | 'alert' | 'info';
export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    phone: string;
    email: string;
    department: string;
    createdAt: string;
    updatedAt: string;
}
export interface AuthUser extends User {
    token: string;
}
export interface Project {
    id: string;
    projectNo: string;
    name: string;
    clientName: string;
    clientContact: string;
    clientPhone: string;
    projectType: 'construction' | 'goods' | 'service';
    budgetAmount: number;
    biddingMethod: 'open' | 'invited' | 'competitive_negotiation';
    status: ProjectStatus;
    currentHandlerId: string;
    currentHandlerName: string;
    currentHandlerRole: UserRole;
    projectSpecialistId: string;
    projectSpecialistName: string;
    reviewSecretaryId: string | null;
    reviewSecretaryName: string | null;
    financeId: string | null;
    financeName: string | null;
    estimatedBiddingDate: string | null;
    actualBiddingDate: string | null;
    biddingLocation: string | null;
    roomNumber: string | null;
    description: string | null;
    remarks: string | null;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}
export interface ProjectArrangement {
    id: string;
    projectId: string;
    projectNo: string;
    projectName: string;
    status: ArrangementStatus;
    biddingDate: string;
    biddingStartTime: string;
    biddingEndTime: string;
    biddingLocation: string;
    roomNumber: string;
    expertCount: number;
    expertIds: string[];
    supervisionExpertId: string | null;
    supervisionExpertName: string | null;
    documentPreparation: boolean;
    venueReservation: boolean;
    equipmentCheck: boolean;
    materialPrinting: boolean;
    financeConfirmed: boolean;
    depositReceived: boolean;
    feeCalculated: boolean;
    applicantId: string;
    applicantName: string;
    applicantRole: UserRole;
    reviewerId: string | null;
    reviewerName: string | null;
    reviewComment: string | null;
    reviewedAt: string | null;
    rejectReason: string | null;
    rejectedAt: string | null;
    lastModifiedAt: string | null;
    modificationCount: number;
    blockReason: string | null;
    blockAt: string | null;
    blockHandlerId: string | null;
    blockHandlerName: string | null;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}
export interface Expert {
    id: string;
    expertNo: string;
    name: string;
    gender: 'male' | 'female';
    phone: string;
    email: string;
    idCard: string;
    expertise: string[];
    title: string;
    organization: string;
    status: ExpertStatus;
    totalSigninCount: number;
    absentCount: number;
    lateCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface ExpertSigninRecord {
    id: string;
    projectId: string;
    projectNo: string;
    projectName: string;
    arrangementId: string;
    expertId: string;
    expertName: string;
    expertise: string;
    status: SigninStatus;
    scheduledArrivalTime: string;
    actualArrivalTime: string | null;
    signinTime: string | null;
    signinMethod: 'manual' | 'card' | 'face' | 'qr' | null;
    seatNumber: string | null;
    isSupervision: boolean;
    leaveReason: string | null;
    substituteExpertId: string | null;
    substituteExpertName: string | null;
    signinCompleteReason: string | null;
    handlerId: string | null;
    handlerName: string | null;
    handlerRole: UserRole | null;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}
export interface OperationLog {
    id: string;
    entityType: 'project' | 'arrangement' | 'signin' | 'expert' | 'exception' | 'notification';
    entityId: string;
    action: string;
    description: string;
    operatorId: string;
    operatorName: string;
    operatorRole: UserRole;
    oldStatus?: string;
    newStatus?: string;
    details?: Record<string, unknown>;
    timestamp: string;
}
export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedBy: string;
    uploadedByName: string;
    uploadedAt: string;
    category: 'document' | 'evidence' | 'notice' | 'other';
}
export interface ExceptionRecord {
    id: string;
    projectId: string;
    projectNo: string;
    projectName: string;
    type: ExceptionType;
    severity: ExceptionSeverity;
    status: ExceptionStatus;
    title: string;
    description: string;
    triggeredAt: string;
    triggeredBy: string;
    triggerSource: 'system' | 'manual';
    handlerId: string | null;
    handlerName: string | null;
    handlerRole: UserRole | null;
    handledAt: string | null;
    resolution: string | null;
    autoTrigger: boolean;
    triggerCondition: string | null;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}
export interface Notification {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    type: NotificationType;
    title: string;
    content: string;
    relatedEntityType: 'project' | 'arrangement' | 'signin' | 'exception';
    relatedEntityId: string;
    isRead: boolean;
    readAt: string | null;
    actionRequired: boolean;
    actionUrl: string | null;
    createdAt: string;
}
export interface TimelineEvent {
    id: string;
    time: string;
    type: 'status_change' | 'action' | 'exception' | 'notification' | 'attachment';
    title: string;
    content: string;
    operatorId: string | null;
    operatorName: string | null;
    operatorRole: UserRole | null;
    attachments: Attachment[];
    metadata?: Record<string, unknown>;
}
export interface StatusTransition {
    from: ProjectStatus | null;
    to: ProjectStatus;
    action: string;
    allowedRoles: UserRole[];
    requiredHandlerRole: UserRole;
    description: string;
    autoTriggerException?: ExceptionType;
}
export interface ArrangementTransition {
    from: ArrangementStatus | null;
    to: ArrangementStatus;
    action: string;
    allowedRoles: UserRole[];
    description: string;
}
export interface BlockAnalysis {
    isBlocked: boolean;
    blockReason: string | null;
    blockAt: string | null;
    blockHandlerId: string | null;
    blockHandlerName: string | null;
    blockHandlerRole: UserRole | null;
    blockedDuration: number;
    pendingActions: string[];
    nextHandler: {
        role: UserRole;
        roleName: string;
        userId: string | null;
        userName: string | null;
    } | null;
}
export interface SigninAnalysis {
    arrangementId?: string;
    totalExperts: number;
    confirmedCount: number;
    absentCount: number;
    leaveCount: number;
    pendingCount: number;
    signinRate: number;
    isComplete: boolean;
    incompleteReason: string | null;
    pendingExperts: {
        recordId: string;
        expertId: string;
        expertName: string;
        status: SigninStatus;
        scheduledTime: string;
        remark: string | null;
    }[];
}
export interface ResponsibilityMatrix {
    projectSpecialist: {
        userId: string;
        userName: string;
        responsibilities: string[];
        pendingTasks: number;
        completedTasks: number;
    };
    reviewSecretary: {
        userId: string | null;
        userName: string | null;
        responsibilities: string[];
        pendingTasks: number;
        completedTasks: number;
    };
    finance: {
        userId: string | null;
        userName: string | null;
        responsibilities: string[];
        pendingTasks: number;
        completedTasks: number;
    };
}
export declare const roleNames: Record<UserRole, string>;
export declare const exceptionTypeNames: Record<ExceptionType, string>;
export declare const statusDisplay: Record<ProjectStatus, {
    label: string;
    color: string;
}>;
export declare const arrangementStatusDisplay: Record<ArrangementStatus, {
    label: string;
    color: string;
}>;
export declare const signinStatusDisplay: Record<SigninStatus, {
    label: string;
    color: string;
}>;
