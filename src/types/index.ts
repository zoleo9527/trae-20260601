export interface Cleaner {
  id: string
  name: string
  phone: string
  avatar: string
  rating: number
  completedOrders: number
  tags: string[]
  status: 'active' | 'inactive' | 'suspended'
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
}

export interface Order {
  id: string
  cleanerId: string
  customerId: string
  serviceType: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled'
  totalAmount: number
  address: string
}

export interface Review {
  id: string
  orderId: string
  customerId: string
  cleanerId: string
  rating: number
  content: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved'
  category: 'service' | 'attitude' | 'timeliness' | 'quality' | 'other'
}

export interface ReviewFollowUp {
  id: string
  reviewId: string
  submittedBy: string
  submittedByRole: 'customer_service' | 'cleaner' | 'quality_manager' | 'admin'
  submittedAt: string
  content: string
  actionTaken: string
  status: 'pending' | 'processing' | 'completed'
  nextAction: string | null
}

export interface Compensation {
  id: string
  reviewId: string
  followUpId: string
  amount: number
  type: 'refund' | 'discount' | 'service' | 'gift'
  approvedBy: string | null
  approvedAt: string | null
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  description: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  role: 'customer_service' | 'cleaner' | 'quality_manager' | 'admin'
  phone: string
}

export interface SystemLog {
  id: string
  userId: string
  action: string
  targetType: string
  targetId: string
  createdAt: string
  details: string
}
