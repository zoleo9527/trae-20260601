export type HouseStatus = 'available' | 'locked' | 'sold' | 'reserved';

export type ControlStage = 'application' | 'review' | 'lock' | 'completed' | 'rejected';

export type OperationType =
  | 'create_application'
  | 'submit_for_review'
  | 'review_approve'
  | 'review_reject'
  | 'lock_house'
  | 'unlock_house'
  | 'complete_sale'
  | 'update_remark';

export type UserRole = 'consultant' | 'manager' | 'controller';

export interface House {
  id: string;
  houseNumber: string;
  building: string;
  unit: string;
  floor: string;
  room: string;
  layout: string;
  area: number;
  unitPrice: number;
  totalPrice: number;
  orientation: string;
  status: HouseStatus;
  floorPlan?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCard?: string;
  level: 'A' | 'B' | 'C' | 'D';
  consultantId: string;
  visitDate: string;
  intentLayout?: string;
  intentPrice?: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roleName: string;
  avatar?: string;
  department: string;
}

export interface StageRecord {
  stage: ControlStage;
  stageName: string;
  handlerId: string;
  handlerName: string;
  handlerRole: UserRole;
  handlerRoleName: string;
  receivedAt: string;
  completedAt?: string;
  remark?: string;
}

export interface Remark {
  id: string;
  content: string;
  source: string;
  sourceName: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operatorRoleName: string;
  timestamp: string;
  stage: ControlStage;
  stageName: string;
  inheritedFrom?: string;
}

export interface SaleControl {
  id: string;
  houseId: string;
  house: House;
  customerId: string;
  customer: Customer;
  applicantId: string;
  applicant: User;
  currentHandlerId: string;
  currentHandler: User;
  previousHandlerId?: string;
  previousHandler?: User;
  status: HouseStatus;
  stage: ControlStage;
  stageName: string;
  lockDuration: number;
  lockExpireAt?: string;
  remarks: Remark[];
  currentRemark: string;
  stageHistory: StageRecord[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  lockedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
}

export interface OperationLog {
  id: string;
  saleControlId: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operatorRoleName: string;
  operationType: OperationType;
  operationTypeName: string;
  beforeStatus: HouseStatus;
  afterStatus: HouseStatus;
  beforeStage?: ControlStage;
  afterStage?: ControlStage;
  beforeHandlerId?: string;
  beforeHandlerName?: string;
  afterHandlerId?: string;
  afterHandlerName?: string;
  remark?: string;
  remarkSource?: string;
  remarkInherited?: boolean;
  timestamp: string;
}

export interface HouseFilters {
  keyword?: string;
  building?: string;
  unit?: string;
  floor?: string;
  layout?: string;
  status?: HouseStatus;
  minArea?: number;
  maxArea?: number;
  minPrice?: number;
  maxPrice?: number;
}
