export type MemberStatus = 'active' | 'inactive' | 'risk';
export type CourseStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type RiskLevel = 'high' | 'medium' | 'low';
export type UserRole = 'coach' | 'manager';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  joinDate: string;
  status: MemberStatus;
  packageRemaining: number;
  packageTotal: number;
  lastVisit: string;
  coachId: string;
  coachName: string;
  goals: string[];
  riskLevel?: RiskLevel;
  riskReason?: string;
  daysSinceLastVisit: number;
  lastMeasurementDate?: string;
  daysSinceLastMeasurement: number;
}

export interface Course {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: CourseStatus;
  type: string;
  notes?: string;
}

export interface BodyMeasurement {
  id: string;
  memberId: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscle: number;
  bmi: number;
  waist: number;
  chest: number;
  hips: number;
  photos: string[];
  notes: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  notes?: string;
}

export interface TrainingPlan {
  id: string;
  memberId: string;
  memberName: string;
  week: number;
  day: string;
  exercises: Exercise[];
}

export interface LeaveRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  makeupCourse?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  courseType: string;
  status: 'completed' | 'cancelled' | 'makeup';
  coachName: string;
}
