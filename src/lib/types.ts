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
  type: 'scheduling' | 'service' | 'general' | 'rejection';
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
}

export interface ServiceRecord {
  id: string;
  scheduleId: string;
  startTime: Date;
  endTime: Date | null;
  actualDuration: number | null;
  completed: boolean;
  notes: string;
}

export interface ConsumptionRecord {
  id: string;
  customerName: string;
  handTagNo: string;
  handTagStatus: HandTagStatus;
  lockerNo: string;
  lockerStatus: LockerStatus;
  checkinTime: Date;
  checkoutTime: Date | null;
  status: ConsumptionStatus;
  totalAmount: number;
  paidAmount: number;
  
  schedules: Schedule[];
  serviceRecords: ServiceRecord[];
  notes: Note[];
  
  rejectionReason: string | null;
  attachments: string[];
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoItem {
  id: string;
  type: 'hand_tag' | 'scheduling' | 'service' | 'locker' | 'payment' | 'review';
  title: string;
  description: string;
  recordId: string;
  priority: 'high' | 'medium' | 'low';
  role: UserRole;
  createdAt: Date;
}
