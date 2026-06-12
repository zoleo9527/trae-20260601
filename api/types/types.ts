export enum UserRole {
  ACCOUNTANT = 'accountant',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum HandoverStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ContactMethod {
  PHONE = 'phone',
  WECHAT = 'wechat',
  EMAIL = 'email',
  VISIT = 'visit',
}

export enum NoteType {
  GENERAL = 'general',
  HANDOVER = 'handover',
  RENEWAL = 'renewal',
  ISSUE = 'issue',
}

export enum CommunicationPreference {
  PHONE = 'phone',
  WECHAT = 'wechat',
  EMAIL = 'email',
}

export interface User {
  id: string
  username: string
  password: string
  name: string
  role: UserRole
  email: string | null
  phone: string | null
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface SafeUser {
  id: string
  username: string
  name: string
  role: UserRole
  email: string | null
  phone: string | null
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  taxNumber: string | null
  contractStartDate: Date | null
  contractEndDate: Date | null
  status: CustomerStatus
  riskLevel: RiskLevel
  riskReasons: string[]
  accountantId: string | null
  managerId: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PendingItems {
  pendingInvoices: string
  pendingDeclarations: string
  pendingAccounts: string
  otherItems: string
}

export interface CustomerHabits {
  communicationPreference: CommunicationPreference
  bestContactTime: string
  specialRequirements: string
  attentionPoints: string
}

export interface InvoiceDetails {
  invoiceType: string
  invoiceFrequency: string
  specialRequirements: string
  historicalIssues: string
}

export interface NextDeclaration {
  taxType: string
  deadline: Date | string
  notes: string
  attachments: string[]
}

export interface Handover {
  id: string
  customerId: string
  fromUserId: string
  toUserId: string
  fromUserRole: 'accountant' | 'manager'
  pendingItems: PendingItems
  customerHabits: CustomerHabits
  invoiceDetails: InvoiceDetails
  nextDeclaration: NextDeclaration
  status: HandoverStatus
  reviewComment: string | null
  reviewerId: string | null
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

export interface RenewalFollowUp {
  id: string
  customerId: string
  userId: string
  contactDate: Date
  contactMethod: ContactMethod
  content: string
  result: string | null
  nextFollowUpDate: Date | null
  attachments: string[]
  createdAt: Date
}

export interface Note {
  id: string
  customerId: string
  userId: string
  type: NoteType
  title: string
  content: string
  attachments: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: SafeUser
}

export interface CreateCustomerRequest {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  taxNumber?: string
  contractStartDate?: string
  contractEndDate?: string
  status?: CustomerStatus
  riskLevel?: RiskLevel
  riskReasons?: string[]
  accountantId?: string
  managerId?: string
  notes?: string
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CreateHandoverRequest {
  customerId: string
  toUserId: string
  fromUserRole: 'accountant' | 'manager'
  pendingItems: PendingItems
  customerHabits: CustomerHabits
  invoiceDetails: InvoiceDetails
  nextDeclaration: NextDeclaration
}

export interface UpdateHandoverRequest extends Partial<CreateHandoverRequest> {
  status?: HandoverStatus
}

export interface CreateFollowUpRequest {
  customerId: string
  contactDate: string
  contactMethod: ContactMethod
  content: string
  result?: string
  nextFollowUpDate?: string
  attachments?: string[]
}

export interface CreateNoteRequest {
  customerId: string
  type: NoteType
  title: string
  content: string
  attachments?: string[]
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {}

export interface CreateUserRequest {
  username: string
  password: string
  name: string
  role: UserRole
  email?: string
  phone?: string
  status?: 'active' | 'inactive'
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {
  password?: string
}

export interface JwtPayload {
  userId: string
  username: string
  role: UserRole
}

export interface DashboardStats {
  totalCustomers: number
  activeCustomers: number
  expiringCustomers: number
  expiredCustomers: number
  suspendedCustomers: number
  highRiskCustomers: number
  mediumRiskCustomers: number
  lowRiskCustomers: number
  pendingHandovers: number
  approvedHandovers: number
  totalHandovers: number
  totalUsers: number
  activeUsers: number
}

export interface HandoverRateStats {
  totalHandovers: number
  approvedHandovers: number
  rejectedHandovers: number
  pendingHandovers: number
  approvalRate: number
}

export interface RenewalRateStats {
  totalExpired: number
  renewed: number
  notRenewed: number
  pending: number
  renewalRate: number
}