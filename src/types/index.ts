export type Role = 'front_desk' | 'therapist' | 'director'

export type PatientCategory = 'post_surgical' | 'pediatric_posture' | 'elderly_balance'

export type PrescriptionStatus = 'draft' | 'pending_review' | 'approved' | 'adjusted' | 'archived'

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Patient {
  id: string
  name: string
  gender: 'male' | 'female'
  age: number
  phone: string
  category: PatientCategory
  categoryLabel: string
  diagnosis: string
  createdAt: string
  updatedAt: string
}

export interface PainPoint {
  id: string
  region: string
  side: 'left' | 'right' | 'bilateral' | 'center'
  severity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  nature: string
  notes: string
}

export interface Contraindication {
  id: string
  type: 'absolute' | 'relative'
  description: string
  reason: string
}

export interface ScaleItem {
  id: string
  name: string
  score: number
  maxScore: number
  interpretation: string
}

export interface Assessment {
  id: string
  patientId: string
  therapistId: string
  therapistName: string
  date: string
  chiefComplaint: string
  presentIllness: string
  scales: ScaleItem[]
  painPoints: PainPoint[]
  contraindications: Contraindication[]
  conclusion: string
  createdAt: string
}

export interface RehabGoal {
  id: string
  description: string
  targetDate: string
  measurable: string
  priority: 'high' | 'medium' | 'low'
}

export interface TreatmentPlanItem {
  id: string
  type: string
  name: string
  frequency: string
  duration: string
  notes: string
}

export interface Prescription {
  id: string
  patientId: string
  assessmentId: string
  version: number
  status: PrescriptionStatus
  therapistId: string
  therapistName: string
  reviewerId?: string
  reviewerName?: string
  reviewedAt?: string
  reviewComment?: string
  goals: RehabGoal[]
  treatmentPlan: TreatmentPlanItem[]
  rationale: string
  createdAt: string
}

export interface Appointment {
  id: string
  patientId: string
  prescriptionId: string
  therapistId: string
  therapistName: string
  date: string
  timeSlot: string
  type: string
  status: AppointmentStatus
  notes: string
  createdAt: string
}

export interface Therapist {
  id: string
  name: string
  specialty: string
}
