export type UserRole = 'sales' | 'hall' | 'kitchen'

export interface User {
  role: UserRole
  name: string
}

export interface Event {
  id: string
  name: string
  client_name: string
  event_date: string
  venue: string
  tables: number
  menu_price: number
  total_amount: number
  status: 'pending' | 'reconciling' | 'feedback' | 'completed'
  created_by: string
  created_at: string
}

export interface ReconciliationConfirmation {
  id: string
  item_id: string
  role: string
  confirmed: number
  name: string
  confirmed_at: string | null
}

export interface ReconciliationItem {
  id: string
  reconciliation_id: string
  category: 'venue' | 'menu' | 'extra' | 'discount'
  description: string
  expected_amount: number
  actual_amount: number | null
  difference: number | null
  difference_note: string
  status: 'pending' | 'confirmed' | 'difference' | 'difference_confirmed'
  confirmations?: ReconciliationConfirmation[]
}

export interface Reconciliation {
  id: string
  event_id: string
  all_confirmed: number
  feedback_activated: number
  feedback_activated_at: string | null
  created_by: string
  created_at: string
  event_name?: string
  client_name?: string
  event_date?: string
  venue?: string
  items?: ReconciliationItem[]
}

export interface FeedbackSection {
  id: string
  feedback_id: string
  role: string
  content: string
  rating: number | null
  filled_by: string
  filled_at: string | null
  deadline: string
}

export interface Feedback {
  id: string
  event_id: string
  completed_at: string | null
  status: 'pending' | 'completed'
  event_name?: string
  client_name?: string
  event_date?: string
  venue?: string
  sections?: FeedbackSection[]
}

export interface TimelineEntry {
  id: string
  event_id: string
  type: string
  title: string
  description: string
  performed_by: string
  role: string
  timestamp: string
}

export interface HandoverItem {
  type: 'reconciliation' | 'reconciliation_difference' | 'feedback'
  itemId?: string
  sectionId?: string
  eventId: string
  reconciliationId?: string
  feedbackId?: string
  eventName: string
  category?: string
  description?: string
  role: string
  name: string
  deadline: string | null
  remainingHours: number | null
}
