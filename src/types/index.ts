export type UserRole = 'reception' | 'processor' | 'manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
}

export type CustomerDraftStatus =
  | 'pending_review'
  | 'rejected'
  | 'approved'
  | 'size_issue'
  | 'color_issue';

export type PrintScheduleStatus =
  | 'draft'
  | 'submitted'
  | 'material_confirmed'
  | 'printing'
  | 'printed'
  | 'installing'
  | 'completed'
  | 'cancelled';

export type MaterialPickupStatus = 'pending' | 'confirmed' | 'returned';

export type InstallationStatus =
  | 'scheduled'
  | 'time_changed'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface CustomerDraft {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  content: string;
  width: number;
  height: number;
  unit: string;
  materialType: string;
  colorRequirement: string;
  draftUrl: string;
  installationAddress: string;
  scheduledInstallDate: string;
  status: CustomerDraftStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PrintSchedule {
  id: string;
  scheduleNo: string;
  draftId: string;
  orderNo: string;
  customerName: string;
  content: string;
  width: number;
  height: number;
  unit: string;
  materialType: string;
  colorRequirement: string;
  quantity: number;
  installationAddress: string;
  scheduledInstallDate: string;
  actualInstallDate?: string;
  status: PrintScheduleStatus;
  priority: 'normal' | 'urgent' | 'emergency';
  remark?: string;
  submittedBy: string;
  submittedAt: string;
  materialConfirmedBy?: string;
  materialConfirmedAt?: string;
  printingStartedBy?: string;
  printingStartedAt?: string;
  printedBy?: string;
  printedAt?: string;
  completedBy?: string;
  completedAt?: string;
}

export interface MaterialItem {
  id: string;
  materialType: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface MaterialPickup {
  id: string;
  pickupNo: string;
  scheduleId: string;
  scheduleNo: string;
  items: MaterialItem[];
  totalAmount: number;
  status: MaterialPickupStatus;
  pickedBy: string;
  pickedAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  returnedBy?: string;
  returnedAt?: string;
  remark?: string;
}

export interface InstallationRecord {
  id: string;
  scheduleId: string;
  scheduleNo: string;
  status: InstallationStatus;
  scheduledDate: string;
  actualDate?: string;
  installers: string[];
  photos: string[];
  customerSigned: boolean;
  signerName?: string;
  signDate?: string;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export type AuditAction =
  | 'draft_create'
  | 'draft_review'
  | 'draft_reject'
  | 'draft_size_issue'
  | 'draft_color_issue'
  | 'schedule_create'
  | 'schedule_submit'
  | 'schedule_material_confirm'
  | 'schedule_start_print'
  | 'schedule_complete_print'
  | 'schedule_start_install'
  | 'schedule_complete'
  | 'schedule_cancel'
  | 'material_pickup'
  | 'material_confirm'
  | 'material_return'
  | 'install_schedule'
  | 'install_time_change'
  | 'install_start'
  | 'install_complete'
  | 'install_fail'
  | 'archive';

export interface AuditLog {
  id: string;
  entityType: 'draft' | 'schedule' | 'material' | 'installation';
  entityId: string;
  action: AuditAction;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
  detail: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export interface ExceptionRecord {
  id: string;
  scheduleId: string;
  scheduleNo: string;
  type: 'size_error' | 'color_complaint' | 'install_time_change' | 'other';
  description: string;
  status: 'pending' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: string;
  handledBy?: string;
  handledAt?: string;
  resolution?: string;
}
