export type UserRole = 'reception' | 'floor_supervisor' | 'finance' | 'admin';

export type ConsumptionStatus = 
  | 'checkin'
  | 'scheduling'
  | 'in_service'
  | 'service_completed'
  | 'checkout_pending'
  | 'completed'
  | 'cancelled';

export type HandTagStatus = 'normal' | 'lost' | 'returned';

export type LockerStatus = 'normal' | 'complaint' | 'maintenance';

export type TechnicianStatus = 'available' | 'busy' | 'rest' | 'off';

export type IssueType = 'hand_tag_lost' | 'locker_complaint' | 'scheduling_conflict' | 'service_rejection' | 'checkout_rejection';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Technician {
  id: string;
  name: string;
  no: string;
  status: TechnicianStatus;
  skills: string[];
}

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: Date;
  type: 'scheduling' | 'service' | 'general' | 'rejection' | 'hand_tag' | 'locker' | 'issue';
  relatedTo?: string;
}

export interface IssueRecord {
  id: string;
  type: IssueType;
  reason: string;
  supplementaryNotes: string;
  createdBy: string;
  createdByRole: UserRole;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  status: 'open' | 'resolved';
  relatedScheduleId?: string;
  relatedServiceId?: string;
}

export interface Schedule {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianNo: string;
  serviceItem: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number;
  roomNo: string;
  notes: string;
  issues: IssueRecord[];
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  rejectionReason?: string;
}

export interface ServiceRecord {
  id: string;
  scheduleId: string;
  startTime: Date;
  endTime: Date | null;
  actualDuration: number | null;
  completed: boolean;
  notes: string;
  issues: IssueRecord[];
}

export interface ConsumptionRecord {
  id: string;
  customerName: string;
  handTagNo: string;
  handTagStatus: HandTagStatus;
  handTagLostReason?: string;
  handTagLostAt?: Date;
  lockerNo: string;
  lockerStatus: LockerStatus;
  lockerComplaintReason?: string;
  lockerComplaintAt?: Date;
  checkinTime: Date;
  checkoutTime: Date | null;
  status: ConsumptionStatus;
  totalAmount: number;
  paidAmount: number;
  
  schedules: Schedule[];
  serviceRecords: ServiceRecord[];
  notes: Note[];
  issues: IssueRecord[];
  
  rejectionReason: string | null;
  attachments: string[];
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoItem {
  id: string;
  type: 'hand_tag' | 'scheduling' | 'service' | 'locker' | 'payment' | 'review' | 'issue';
  title: string;
  description: string;
  recordId: string;
  priority: 'high' | 'medium' | 'low';
  role: UserRole;
  createdAt: Date;
  issueType?: IssueType;
}
