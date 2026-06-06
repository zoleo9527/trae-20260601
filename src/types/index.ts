export type UserRole = 'volunteer' | 'veterinarian' | 'adoption_officer' | 'supply_manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone: string;
}

export type CaseStatus = 'registered' | 'medical' | 'in_care' | 'fostering' | 'adopted' | 'archived';
export type MedicalStatus = 'pending' | 'treating' | 'healthy';
export type AnimalType = 'cat' | 'dog' | 'other';

export interface RescueCase {
  id: string;
  caseNo: string;
  animalName: string;
  animalType: AnimalType;
  breed: string;
  age: string;
  gender: 'male' | 'female' | 'unknown';
  rescueDate: string;
  rescueLocation: string;
  status: CaseStatus;
  currentHandler: string;
  assignee: string;
  medicalStatus: MedicalStatus;
  hasAdoptionApplication: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type FosterStatus = 'active' | 'ended' | 'returned';

export interface FosterFamily {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  capacity: number;
  currentCount: number;
  rating: number;
  hasExperience: boolean;
  preferredTypes: AnimalType[];
  notes: string;
}

export interface FosterRecord {
  id: string;
  caseId: string;
  fosterFamilyId: string;
  fosterFamilyName: string;
  startDate: string;
  endDate?: string;
  status: FosterStatus;
  keyJudgment: string;
  specialRequirements: string;
  returnReason?: string;
  reviewStatus?: ReviewStatus;
  createdBy: string;
  createdAt: string;
}

export type HealthStatus = 'poor' | 'fair' | 'good';

export interface MedicalRecord {
  id: string;
  caseId: string;
  visitDate: string;
  diagnosis: string;
  treatment: string;
  cost: number;
  veterinarian: string;
  healthStatus: HealthStatus;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewStatus?: 'approved' | 'rejected' | 'supplement_needed';
  notes: string;
}

export type SupplyStatus = 'pending' | 'approved' | 'rejected';

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  unitPrice: number;
}

export interface SupplyUsage {
  id: string;
  caseId: string;
  supplyItemId: string;
  supplyName: string;
  quantity: number;
  unit: string;
  usageReason: string;
  fosterJudgmentRef: string;
  requestedBy: string;
  approvedBy?: string;
  status: SupplyStatus;
  createdAt: string;
}

export interface FollowUpPlan {
  id: string;
  scheduledDate: string;
  type: 'phone' | 'visit' | 'video';
  notes: string;
}

export interface FollowUpRecord {
  id: string;
  planId?: string;
  date: string;
  type: 'phone' | 'visit' | 'video';
  content: string;
  operator: string;
  status: 'normal' | 'warning' | 'issue';
}

export type AdoptionStatus = 'pending' | 'approved' | 'rejected';

export interface AdoptionRecord {
  id: string;
  caseId: string;
  adopterName: string;
  adopterPhone: string;
  adopterAddress: string;
  applicationDate: string;
  adoptDate?: string;
  status: AdoptionStatus;
  reviewNotes: string;
  reviewedBy: string;
  followUpPlan: FollowUpPlan[];
  followUpRecords: FollowUpRecord[];
}

export type ReviewType = 'medical' | 'foster' | 'archive';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'supplement_needed';

export interface ReviewLog {
  id: string;
  caseId: string;
  targetId: string;
  type: ReviewType;
  status: ReviewStatus;
  reviewer: string;
  reviewNotes: string;
  supplementReason?: string;
  createdAt: string;
}

export type TimelineEventType = 
  | 'register' 
  | 'medical' 
  | 'foster' 
  | 'supply' 
  | 'adoption' 
  | 'review' 
  | 'archive' 
  | 'return' 
  | 'supplement'
  | 'followup';

export interface TimelineEvent {
  id: string;
  caseId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  operator: string;
  timestamp: string;
}

export interface FilterOptions {
  status?: CaseStatus[];
  medicalStatus?: MedicalStatus[];
  assignee?: string;
  keyword?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
