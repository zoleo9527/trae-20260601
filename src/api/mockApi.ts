import type { Order, Location, DeliveryNote, OperationLog, LockRequest, AllocationRequest, PickRequest, LoadRequest, DeliverRequest, SignRequest, CompleteRequest } from '@/types';

const BASE_URL = 'http://localhost:3002/api';

const generateIdempotencyKey = () => {
  return `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const currentUser = {
  id: 'u1',
  name: '张主管',
  role: 'warehouse_manager' as const,
};

export const api = {
  orders: {
    list: async (): Promise<Order[]> => {
      const response = await fetch(`${BASE_URL}/orders`);
      return response.json();
    },
    
    get: async (id: string): Promise<Order> => {
      const response = await fetch(`${BASE_URL}/orders/${id}`);
      return response.json();
    },
    
    create: async (data: { customerName: string; customerPhone?: string; items: Array<{ productName: string; spec?: string; unit: string; quantity: number }>; notes?: string }) => {
      const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    lock: async (orderId: string, items: Array<{ id: string; lockedQuantity: number }>): Promise<{ success: boolean; orderId: string; lockStatus: string }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          items,
        }),
      });
      return response.json();
    },
    
    allocate: async (orderId: string, allocations: Array<{ itemId: string; locationId: string; quantity: number }>): Promise<{ success: boolean; orderId: string; fullyAllocated: boolean }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/allocate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
          allocations,
        }),
      });
      return response.json();
    },
    
    pick: async (orderId: string): Promise<{ success: boolean; orderId: string }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/pick`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: currentUser.role,
        }),
      });
      return response.json();
    },
    
    load: async (orderId: string, licensePlate?: string): Promise<{ success: boolean; orderId: string }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/load`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'driver',
          licensePlate,
        }),
      });
      return response.json();
    },
    
    deliver: async (orderId: string): Promise<{ success: boolean; orderId: string }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/deliver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'driver',
        }),
      });
      return response.json();
    },
    
    sign: async (orderId: string, signerName: string, signerPhone: string): Promise<{ success: boolean; orderId: string }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'customer_service',
          signerName,
          signerPhone,
        }),
      });
      return response.json();
    },
    
    complete: async (orderId: string): Promise<{ success: boolean; orderId: string }> => {
      const response = await fetch(`${BASE_URL}/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'customer_service',
        }),
      });
      return response.json();
    },
  },
  
  locations: {
    list: async (): Promise<Location[]> => {
      const response = await fetch(`${BASE_URL}/locations`);
      return response.json();
    },
    
    available: async (): Promise<Location[]> => {
      const response = await fetch(`${BASE_URL}/locations/available`);
      return response.json();
    },
    
    get: async (id: string): Promise<Location> => {
      const response = await fetch(`${BASE_URL}/locations/${id}`);
      return response.json();
    },
    
    create: async (data: { code: string; zone: string; rack?: string; level?: string; capacity: number }) => {
      const response = await fetch(`${BASE_URL}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    update: async (id: string, data: Partial<{ code: string; zone: string; rack?: string; level?: string; capacity: number; status: string }>) => {
      const response = await fetch(`${BASE_URL}/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/locations/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },
  
  deliveryNotes: {
    list: async (): Promise<DeliveryNote[]> => {
      const response = await fetch(`${BASE_URL}/delivery-notes`);
      return response.json();
    },
    
    get: async (id: string): Promise<DeliveryNote> => {
      const response = await fetch(`${BASE_URL}/delivery-notes/${id}`);
      return response.json();
    },
    
    create: async (data: { orderId: string; orderNo: string; driverId: string; driverName: string; licensePlate?: string }) => {
      const response = await fetch(`${BASE_URL}/delivery-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    
    load: async (id: string) => {
      const response = await fetch(`${BASE_URL}/delivery-notes/${id}/load`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'driver',
        }),
      });
      return response.json();
    },
    
    deliver: async (id: string) => {
      const response = await fetch(`${BASE_URL}/delivery-notes/${id}/deliver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'driver',
        }),
      });
      return response.json();
    },
    
    sign: async (id: string, signerName: string, signerPhone: string) => {
      const response = await fetch(`${BASE_URL}/delivery-notes/${id}/sign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: currentUser.id,
          operatorName: currentUser.name,
          operatorRole: 'customer_service',
          signerName,
          signerPhone,
        }),
      });
      return response.json();
    },
  },
  
  logs: {
    list: async (orderId?: string): Promise<OperationLog[]> => {
      const url = orderId ? `${BASE_URL}/logs?orderId=${orderId}` : `${BASE_URL}/logs`;
      const response = await fetch(url);
      return response.json();
    },
  },
  
  users: {
    list: async () => {
      const response = await fetch(`${BASE_URL}/users`);
      return response.json();
    },
    
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/users/${id}`);
      return response.json();
    },
    
    byRole: async (role: string) => {
      const response = await fetch(`${BASE_URL}/users/role/${role}`);
      return response.json();
    },
  },
  
  currentUser: () => currentUser,
};
