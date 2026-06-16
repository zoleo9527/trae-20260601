import type { User, SoupBase, SoldOut, Order, AuditLog, TodoItem } from '../types';

const BASE_URL = 'http://localhost:3001/api';

const currentUser = { name: '李主管', role: '后厨主管' as const };

const createHeaders = () => ({
  'Content-Type': 'application/json',
  'actor': currentUser.name,
  'actorRole': currentUser.role,
});

const parseOrders = (orders: any[]): Order[] => {
  return orders.map(order => ({
    ...order,
    dishes: typeof order.dishes === 'string' ? JSON.parse(order.dishes) : order.dishes,
  }));
};

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await fetch(`${BASE_URL}/users`);
    return res.json();
  },
  getById: async (id: string): Promise<User> => {
    const res = await fetch(`${BASE_URL}/users/${id}`);
    return res.json();
  },
  getByRole: async (role: string): Promise<User[]> => {
    const res = await fetch(`${BASE_URL}/users/role/${role}`);
    return res.json();
  },
};

export const soupBaseApi = {
  getAll: async (): Promise<SoupBase[]> => {
    const res = await fetch(`${BASE_URL}/soupBases`);
    return res.json();
  },
  getById: async (id: string): Promise<SoupBase> => {
    const res = await fetch(`${BASE_URL}/soupBases/${id}`);
    return res.json();
  },
  create: async (data: Omit<SoupBase, 'id' | 'createdAt' | 'updatedAt'>): Promise<SoupBase> => {
    const res = await fetch(`${BASE_URL}/soupBases`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  update: async (id: string, data: Partial<SoupBase>): Promise<SoupBase> => {
    const res = await fetch(`${BASE_URL}/soupBases/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  prepare: async (id: string): Promise<SoupBase> => {
    const res = await fetch(`${BASE_URL}/soupBases/${id}/prepare`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return res.json();
  },
  complete: async (id: string, additionalStock?: number): Promise<SoupBase> => {
    const res = await fetch(`${BASE_URL}/soupBases/${id}/complete`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ additionalStock }),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`${BASE_URL}/soupBases/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

export const soldOutApi = {
  getAll: async (status?: string): Promise<SoldOut[]> => {
    const url = status ? `${BASE_URL}/soldOuts?status=${status}` : `${BASE_URL}/soldOuts`;
    const res = await fetch(url);
    return res.json();
  },
  getById: async (id: string): Promise<SoldOut> => {
    const res = await fetch(`${BASE_URL}/soldOuts/${id}`);
    return res.json();
  },
  create: async (data: Omit<SoldOut, 'id' | 'status' | 'reportedAt' | 'resolvedAt' | 'createdAt' | 'updatedAt' | 'history'>): Promise<SoldOut> => {
    const res = await fetch(`${BASE_URL}/soldOuts`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  update: async (id: string, data: Partial<Pick<SoldOut, 'notes' | 'refundReason' | 'supplementNotes'>>): Promise<SoldOut> => {
    const res = await fetch(`${BASE_URL}/soldOuts/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  confirm: async (id: string): Promise<SoldOut> => {
    const res = await fetch(`${BASE_URL}/soldOuts/${id}/confirm`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return res.json();
  },
  resolve: async (id: string): Promise<SoldOut> => {
    const res = await fetch(`${BASE_URL}/soldOuts/${id}/resolve`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`${BASE_URL}/soldOuts/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

export const orderApi = {
  getAll: async (status?: string, isGroupBuy?: boolean): Promise<Order[]> => {
    let url = `${BASE_URL}/orders`;
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (isGroupBuy !== undefined) params.push(`isGroupBuy=${isGroupBuy}`);
    if (params.length) url += `?${params.join('&')}`;
    const res = await fetch(url);
    const data = await res.json();
    return parseOrders(data);
  },
  getById: async (id: string): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders/${id}`);
    const data = await res.json();
    return {
      ...data,
      dishes: typeof data.dishes === 'string' ? JSON.parse(data.dishes) : data.dishes,
    };
  },
  create: async (data: Omit<Order, 'id' | 'status' | 'paidAmount' | 'groupBuyVerified' | 'createdAt' | 'updatedAt' | 'servedAt' | 'completedAt'>): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        ...data,
        dishes: JSON.stringify(data.dishes),
      }),
    });
    const result = await res.json();
    return {
      ...result,
      dishes: typeof result.dishes === 'string' ? JSON.parse(result.dishes) : result.dishes,
    };
  },
  update: async (id: string, data: Partial<Order>): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({
        ...data,
        dishes: data.dishes ? JSON.stringify(data.dishes) : undefined,
      }),
    });
    const result = await res.json();
    return {
      ...result,
      dishes: typeof result.dishes === 'string' ? JSON.parse(result.dishes) : result.dishes,
    };
  },
  verify: async (id: string): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders/${id}/verify`, {
      method: 'POST',
      headers: createHeaders(),
    });
    const result = await res.json();
    return {
      ...result,
      dishes: typeof result.dishes === 'string' ? JSON.parse(result.dishes) : result.dishes,
    };
  },
  confirm: async (id: string): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders/${id}/confirm`, {
      method: 'POST',
      headers: createHeaders(),
    });
    const result = await res.json();
    return {
      ...result,
      dishes: typeof result.dishes === 'string' ? JSON.parse(result.dishes) : result.dishes,
    };
  },
  serve: async (id: string): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders/${id}/serve`, {
      method: 'POST',
      headers: createHeaders(),
    });
    const result = await res.json();
    return {
      ...result,
      dishes: typeof result.dishes === 'string' ? JSON.parse(result.dishes) : result.dishes,
    };
  },
  complete: async (id: string): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders/${id}/complete`, {
      method: 'POST',
      headers: createHeaders(),
    });
    const result = await res.json();
    return {
      ...result,
      dishes: typeof result.dishes === 'string' ? JSON.parse(result.dishes) : result.dishes,
    };
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`${BASE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

export const auditLogApi = {
  getAll: async (action?: string, targetType?: string, actor?: string): Promise<AuditLog[]> => {
    let url = `${BASE_URL}/auditLogs`;
    const params: string[] = [];
    if (action) params.push(`action=${action}`);
    if (targetType) params.push(`targetType=${targetType}`);
    if (actor) params.push(`actor=${actor}`);
    if (params.length) url += `?${params.join('&')}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.map((log: any) => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
    }));
  },
  getById: async (id: string): Promise<AuditLog> => {
    const res = await fetch(`${BASE_URL}/auditLogs/${id}`);
    const data = await res.json();
    return {
      ...data,
      details: typeof data.details === 'string' ? JSON.parse(data.details) : data.details,
    };
  },
};

export const todoItemApi = {
  getAll: async (assigneeRole?: string, completed?: boolean): Promise<TodoItem[]> => {
    let url = `${BASE_URL}/todoItems`;
    const params: string[] = [];
    if (assigneeRole) params.push(`assigneeRole=${encodeURIComponent(assigneeRole)}`);
    if (completed !== undefined) params.push(`completed=${completed}`);
    if (params.length) url += `?${params.join('&')}`;
    const res = await fetch(url);
    return res.json();
  },
  getById: async (id: string): Promise<TodoItem> => {
    const res = await fetch(`${BASE_URL}/todoItems/${id}`);
    return res.json();
  },
  complete: async (id: string): Promise<TodoItem> => {
    const res = await fetch(`${BASE_URL}/todoItems/${id}/complete`, {
      method: 'PUT',
      headers: createHeaders(),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await fetch(`${BASE_URL}/todoItems/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

export const getCurrentUser = () => currentUser;

export const setCurrentUser = (user: { name: string; role: string }) => {
  Object.assign(currentUser, user);
};
