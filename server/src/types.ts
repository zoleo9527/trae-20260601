export type Role = 'operator' | 'guide' | 'fleet' | 'supervisor';

export type ComplaintStatus = 'registered' | 'assigned' | 'processing' | 'compensating' | 'closed';

export type ComplaintType = 'service' | 'transport' | 'accommodation' | 'food' | 'schedule' | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'urgent';

export type AssignTarget = 'guide' | 'fleet';

export type TimelineEventType = 'created' | 'assigned' | 'reassigned' | 'note' | 'status_change' | 'compensation_proposed' | 'compensation_approved' | 'compensation_rejected' | 'compensation_executed' | 'closed' | 'reopened';

export type CompensationStatus = 'proposed' | 'approved' | 'rejected' | 'executed';

export type CompensationType = 'refund' | 'discount' | 'gift' | 'upgrade' | 'apology_letter' | 'other';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  role: Role;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Compensation {
  id: string;
  type: CompensationType;
  amount: number;
  description: string;
  status: CompensationStatus;
  proposedBy: string;
  proposedByName: string;
  proposedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  executedAt?: string;
  rejectionReason?: string;
}

export interface AssignmentHistoryEntry {
  assignedTo: string;
  assignedToName: string;
  assignedRole: AssignTarget;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  removedAt?: string;
  removedBy?: string;
  removedByName?: string;
  reason?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  tourGroup: string;
  complaintType: ComplaintType;
  severity: Severity;
  status: ComplaintStatus;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedRole?: AssignTarget;
  assignmentHistory: AssignmentHistoryEntry[];
  timeline: TimelineEvent[];
  compensation?: Compensation;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
