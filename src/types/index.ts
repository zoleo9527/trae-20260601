export enum Role {
  FreightClerk = 'freight_clerk',
  LoadingLeader = 'loading_leader',
  CustomerService = 'customer_service',
}

export enum LoadingPlanStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Allocated = 'allocated',
  Loading = 'loading',
  Completed = 'completed',
  Returned = 'returned',
}

export enum WagonAllocationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Loaded = 'loaded',
  Released = 'released',
}

export enum ArrivalPickupStatus {
  Pending = 'pending',
  Notified = 'notified',
  PickedUp = 'picked_up',
  Unclaimed = 'unclaimed',
}

export enum HandoverAction {
  Submit = 'submit',
  Confirm = 'confirm',
  Return = 'return',
  Alert = 'alert',
  Change = 'change',
}

export enum StuckType {
  PlanChangeTimeout = 'plan_change_timeout',
  PlanUnallocated = 'plan_unallocated',
  AllocationUnconfirmed = 'allocation_unconfirmed',
  ArrivalUnclaimed = 'arrival_unclaimed',
  DamageNoPhoto = 'damage_no_photo',
}

export enum StuckSeverity {
  Warning = 'warning',
  Critical = 'critical',
}

export interface PlanChangeRecord {
  changedAt: string;
  changedBy: string;
  changeReason: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
}

export interface LoadingPlan {
  id: string;
  planNo: string;
  freightTicketNo: string;
  status: LoadingPlanStatus;
  cargoType: string;
  cargoWeight: number;
  cargoVolume: number;
  plannedLoadDate: string;
  destinationStation: string;
  submittedBy: string;
  submittedAt: string | null;
  changeHistory: PlanChangeRecord[];
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string | null;
}

export interface WagonAllocation {
  id: string;
  allocationNo: string;
  loadingPlanId: string;
  wagonNo: string;
  wagonType: string;
  loadCapacity: number;
  actualLoadWeight: number | null;
  status: WagonAllocationStatus;
  allocatedBy: string;
  allocatedAt: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  idempotencyKey: string | null;
}

export interface ArrivalNotice {
  id: string;
  noticeNo: string;
  loadingPlanId: string;
  wagonAllocationId: string;
  arrivalDate: string;
  pickupStatus: ArrivalPickupStatus;
  consigneeName: string;
  consigneePhone: string;
  consigneeNotifiedAt: string | null;
  unclaimedSince: string | null;
  createdAt: string;
}

export interface DamageRecord {
  id: string;
  loadingPlanId: string;
  wagonAllocationId: string;
  reportedBy: string;
  reportedAt: string;
  damageType: string;
  damageDescription: string;
  hasPhoto: boolean;
  photoUrls: string[];
  createdAt: string;
}

export interface HandoverRecord {
  id: string;
  entityType: 'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record';
  entityId: string;
  fromRole: Role;
  toRole: Role;
  fromUserId: string;
  toUserId: string;
  action: HandoverAction;
  comment: string;
  timestamp: string;
}

export interface StuckOrder {
  id: string;
  entityType: 'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record';
  entityId: string;
  stuckType: StuckType;
  severity: StuckSeverity;
  description: string;
  detectedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface SubmitLoadingPlanRequest {
  planNo: string;
  freightTicketNo: string;
  cargoType: string;
  cargoWeight: number;
  cargoVolume: number;
  plannedLoadDate: string;
  destinationStation: string;
  submittedBy: string;
  idempotencyKey?: string;
}

export interface ChangeLoadingPlanRequest {
  changeReason: string;
  changedBy: string;
  changes: Record<string, unknown>;
}

export interface AllocateWagonRequest {
  loadingPlanId: string;
  wagonNo: string;
  wagonType: string;
  loadCapacity: number;
  allocatedBy: string;
  idempotencyKey?: string;
}

export interface ConfirmAllocationRequest {
  confirmedBy: string;
  actualLoadWeight?: number;
}

export interface RecordArrivalRequest {
  loadingPlanId: string;
  wagonAllocationId: string;
  arrivalDate: string;
  consigneeName: string;
  consigneePhone: string;
}

export interface RecordDamageRequest {
  loadingPlanId: string;
  wagonAllocationId: string;
  reportedBy: string;
  damageType: string;
  damageDescription: string;
  photoUrls?: string[];
}

export interface StuckFilterParams {
  severity?: StuckSeverity;
  stuckType?: StuckType;
  entityType?: 'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record';
  since?: string;
  until?: string;
}

export interface StuckSummaryItem {
  stuckType: StuckType;
  severity: StuckSeverity;
  count: number;
  earliestDetectedAt: string;
}

export interface PendingTaskItem {
  entityType: 'loading_plan' | 'wagon_allocation' | 'arrival_notice' | 'damage_record';
  entityId: string;
  entityDisplayId: string;
  currentStatus: string;
  waitingForRole: Role;
  waitingSince: string;
  dwellHours: number;
  blockingReason: string | null;
  relatedStuckOrders: StuckOrder[];
}

export interface ResolveStuckRequest {
  resolution: string;
}

export const STUCK_THRESHOLDS = {
  PLAN_CHANGE_HOURS: 24,
  PLAN_UNALLOCATED_HOURS: 4,
  ALLOCATION_UNCONFIRMED_HOURS: 12,
  ARRIVAL_UNCLAIMED_HOURS: 48,
} as const;

export const ROLE_HANDOVER_ORDER: Role[] = [
  Role.FreightClerk,
  Role.LoadingLeader,
  Role.CustomerService,
];

export function getNextRole(currentRole: Role): Role | null {
  const idx = ROLE_HANDOVER_ORDER.indexOf(currentRole);
  if (idx < 0 || idx >= ROLE_HANDOVER_ORDER.length - 1) return null;
  return ROLE_HANDOVER_ORDER[idx + 1];
}
