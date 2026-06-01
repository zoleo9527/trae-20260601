import { contextBridge, ipcRenderer } from 'electron'
import type {
  Customer, Order, OrderItem, Proof, Machine, Schedule, User,
  WorkspaceState, OrderStatus, ProofStatus, MachineStatus, ScheduleStatus,
  QuoteCalculationInput, QuoteResult, DatabaseResult, UserRole, Urgency
} from './types'

const api = {
  getWorkspaceState: (): Promise<DatabaseResult<WorkspaceState>> => 
    ipcRenderer.invoke('get-workspace-state'),
  saveWorkspaceState: (state: Partial<WorkspaceState>): Promise<DatabaseResult<WorkspaceState>> => 
    ipcRenderer.invoke('save-workspace-state', state),

  getUsers: (): Promise<DatabaseResult<User[]>> => 
    ipcRenderer.invoke('get-users'),

  getOrders: (status?: OrderStatus, fromDate?: string, toDate?: string, search?: string): Promise<DatabaseResult<Order[]>> => 
    ipcRenderer.invoke('get-orders', status, fromDate, toDate, search),
  getOrderById: (id: number): Promise<DatabaseResult<Order>> => 
    ipcRenderer.invoke('get-order-by-id', id),
  createOrder: (order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Order>> => 
    ipcRenderer.invoke('create-order', order),
  updateOrder: (id: number, updates: Partial<Order>): Promise<DatabaseResult<Order>> => 
    ipcRenderer.invoke('update-order', id, updates),
  updateOrderStatus: (orderId: number, newStatus: OrderStatus, userId: number, note?: string): Promise<DatabaseResult<Order>> => 
    ipcRenderer.invoke('update-order-status', orderId, newStatus, userId, note),

  calculateQuote: (input: QuoteCalculationInput): Promise<QuoteResult> => 
    ipcRenderer.invoke('calculate-quote', input),

  getCustomers: (search?: string): Promise<DatabaseResult<Customer[]>> => 
    ipcRenderer.invoke('get-customers', search),
  createCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Customer>> => 
    ipcRenderer.invoke('create-customer', customer),

  getProofsByOrder: (orderId: number): Promise<DatabaseResult<Proof[]>> => 
    ipcRenderer.invoke('get-proofs-by-order', orderId),
  createProof: (proof: Omit<Proof, 'id' | 'uploaded_at' | 'is_current'>): Promise<DatabaseResult<Proof>> => 
    ipcRenderer.invoke('create-proof', proof),
  reviewProof: (proofId: number, status: 'approved' | 'rejected', userId: number, feedback?: string): Promise<DatabaseResult<Proof>> => 
    ipcRenderer.invoke('review-proof', proofId, status, userId, feedback),
  selectProofFile: (): Promise<{ canceled: boolean; filePaths?: string[] }> => 
    ipcRenderer.invoke('select-proof-file'),

  getMachines: (): Promise<DatabaseResult<Machine[]>> => 
    ipcRenderer.invoke('get-machines'),
  updateMachineStatus: (id: number, status: MachineStatus, note?: string): Promise<DatabaseResult<Machine>> => 
    ipcRenderer.invoke('update-machine-status', id, status, note),

  getSchedules: (date?: string, machineId?: number): Promise<DatabaseResult<(Schedule & { 
    order_no: string; customer_name: string; product_name: string; quantity: number; 
    deadline: string; urgency: Urgency; order_status: OrderStatus;
    machine_name: string; machine_status: MachineStatus;
  })[]>> => 
    ipcRenderer.invoke('get-schedules', date, machineId),
  createSchedule: (schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Schedule>> => 
    ipcRenderer.invoke('create-schedule', schedule),
  updateSchedule: (id: number, updates: Partial<Schedule>): Promise<DatabaseResult<Schedule>> => 
    ipcRenderer.invoke('update-schedule', id, updates),

  exportData: (): Promise<DatabaseResult<any>> => 
    ipcRenderer.invoke('export-data'),
  importData: (data: any): Promise<DatabaseResult<{ count: number }>> => 
    ipcRenderer.invoke('import-data', data),
  showExportDialog: (defaultPath: string): Promise<{ canceled: boolean; filePath?: string }> => 
    ipcRenderer.invoke('show-export-dialog', defaultPath),
  showImportDialog: (): Promise<{ canceled: boolean; filePaths?: string[] }> => 
    ipcRenderer.invoke('show-import-dialog'),

  readJsonFile: (filePath: string): Promise<any> => 
    ipcRenderer.invoke('read-json-file', filePath),
  writeJsonFile: (filePath: string, data: any): Promise<DatabaseResult<void>> => 
    ipcRenderer.invoke('write-json-file', filePath, data),

  getCurrentUser: (): Promise<DatabaseResult<User>> => 
    ipcRenderer.invoke('get-current-user'),
  switchRole: (role: UserRole): Promise<DatabaseResult<User>> => 
    ipcRenderer.invoke('switch-role', role),
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
