import type { PurchaseOrder, User, AcceptanceAction, SampleData, ExceptionComment, DisputeData, DisputeComment } from '../types'

const API_BASE = '/api'

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

async function request(url: string, options: RequestOptions = {}): Promise<any> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const api = {
  purchaseOrders: {
    getAll: (): Promise<PurchaseOrder[]> => request('/purchases'),
    get: (id: string): Promise<PurchaseOrder> => request(`/purchases/${id}`),
    create: (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => 
      request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => 
      request(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  
  acceptance: {
    process: (purchaseId: string, data: { action: AcceptanceAction; remark: string; operatorId: string; operatorName: string }): Promise<PurchaseOrder> => 
      request(`/acceptance/${purchaseId}`, { method: 'POST', body: JSON.stringify(data) }),
    resubmit: (purchaseId: string, data: { remark: string; operatorId: string; operatorName: string; attachments?: string[] }): Promise<PurchaseOrder> => 
      request(`/acceptance/${purchaseId}/resubmit`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  samples: {
    submit: (purchaseId: string, data: SampleData): Promise<PurchaseOrder> => 
      request(`/samples/${purchaseId}`, { method: 'POST', body: JSON.stringify(data) }),
    confirm: (purchaseId: string, data: { operatorId: string; operatorName: string; remark?: string }): Promise<PurchaseOrder> => 
      request(`/samples/${purchaseId}/confirm`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  exceptions: {
    get: (purchaseId: string): Promise<any[]> => request(`/exceptions/${purchaseId}`),
    addComment: (purchaseId: string, exceptionId: string, data: ExceptionComment): Promise<PurchaseOrder> => 
      request(`/exceptions/${purchaseId}/comments/${exceptionId}`, { method: 'POST', body: JSON.stringify(data) }),
    resolve: (purchaseId: string, exceptionId: string, data: any): Promise<PurchaseOrder> => 
      request(`/exceptions/${purchaseId}/resolve/${exceptionId}`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  disputes: {
    raise: (purchaseId: string, data: DisputeData): Promise<PurchaseOrder> => 
      request(`/disputes/${purchaseId}/raise`, { method: 'POST', body: JSON.stringify(data) }),
    mediate: (purchaseId: string, data: { mediatorId: string; mediatorName: string; resolution: string; resolutionType: 'accept' | 'reject' | 'compromise' }): Promise<PurchaseOrder> => 
      request(`/disputes/${purchaseId}/mediate`, { method: 'POST', body: JSON.stringify(data) }),
    addComment: (purchaseId: string, data: DisputeComment): Promise<PurchaseOrder> => 
      request(`/disputes/${purchaseId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  },
  
  users: {
    getAll: (): Promise<User[]> => request('/users'),
  },
}
