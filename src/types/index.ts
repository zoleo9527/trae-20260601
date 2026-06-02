export type UserRole = 'reception' | 'counselor' | 'supervisor';

export type AppointmentType = 'initial' | 'followup';

export type AppointmentStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled' | 'pending';

export type ScaleStatus = 'not_sent' | 'sent' | 'submitted' | 'retest_needed' | 'retest_submitted';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TriageStatus = 'pending' | 'assigned';

export type RiskCaseStatus = 'pending_review' | 'reviewed' | 'action_taken';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  counselorId?: string;
  avatar?: string;
}

export interface Client {
  id: string;
  anonymousName: string;
  riskLevel: RiskLevel;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  counselorId: string | null;
  counselorName?: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  rescheduleRequest?: {
    reason: string;
    requestedDate: string;
    requestedTime: string;
  };
  scaleStatus: ScaleStatus;
  notes?: string;
  createdAt: string;
}

export interface Counselor {
  id: string;
  name: string;
  specialty: string[];
  avatar?: string;
}

export interface CounselorSchedule {
  counselorId: string;
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

export interface TriageItem {
  id: string;
  appointmentId: string;
  clientName: string;
  intakeNotes: string;
  suggestedCounselors: string[];
  assignedCounselorId: string | null;
  status: TriageStatus;
  createdAt: string;
}

export interface RiskCase {
  id: string;
  appointmentId: string;
  clientName: string;
  counselorName: string;
  riskLevel: 'high' | 'critical';
  riskIndicators: string[];
  supervisorNotes?: string;
  status: RiskCaseStatus;
  reportedAt: string;
  reviewedAt?: string;
}

export interface ScaleRecord {
  id: string;
  appointmentId: string;
  clientName: string;
  scaleType: string;
  status: ScaleStatus;
  sentAt?: string;
  submittedAt?: string;
  clientNotified: boolean;
  needsRetest: boolean;
  retestDeadline?: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  type: 'reschedule' | 'triage' | 'scale' | 'risk' | 'other';
  relatedId: string;
  dueAt?: string;
}
