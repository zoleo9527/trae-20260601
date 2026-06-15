export type UserRole = 'manager' | 'dispatcher' | 'technician' | 'driver';

export type InspectionStatus =
  | 'pending_manager'
  | 'pending_dispatch'
  | 'pending_inspection'
  | 'inspecting'
  | 'pending_repair'
  | 'pending_sign'
  | 'completed'
  | 'disputed';

export type InspectionItemResult = 'pass' | 'fail' | 'na';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  plateNumber: string;
  workHours: number;
  status: 'available' | 'rented' | 'maintenance' | 'broken';
  image?: string;
}

export interface Contract {
  id: string;
  contractNo: string;
  lessee: string;
  lesseeContact: string;
  startDate: string;
  endDate: string;
  amount: number;
  equipmentId: string;
  siteAddress: string;
}

export interface InspectionItem {
  id: string;
  category: string;
  name: string;
  result: InspectionItemResult;
  remark?: string;
  photos: string[];
}

export interface TimelineNode {
  id: string;
  role: UserRole;
  handler: string;
  handlerId: string;
  action: string;
  remark?: string;
  timestamp: string;
}

export interface Signature {
  id: string;
  driverName: string;
  driverId: string;
  signatureData: string;
  signedAt: string;
  photos: string[];
  remark?: string;
}

export interface Inspection {
  id: string;
  inspectionNo: string;
  equipmentId: string;
  contractId: string;
  status: InspectionStatus;
  currentHandlerId: string;
  currentRole: UserRole;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: InspectionItem[];
  timeline: TimelineNode[];
  signature?: Signature;
  priority: 'normal' | 'urgent' | 'high';
  siteAddress: string;
  scheduledTime?: string;
  driverId?: string;
  driverName?: string;
}

export interface FilterOptions {
  status?: InspectionStatus[];
  keyword?: string;
  dateRange?: [string, string];
  equipmentType?: string;
  priority?: ('normal' | 'urgent' | 'high')[];
  onlyMine?: boolean;
}
