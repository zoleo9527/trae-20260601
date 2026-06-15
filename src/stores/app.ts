import { reactive } from 'vue';
import type { User, Order, Alert } from '../types';

const API_BASE = 'http://localhost:8000/api';

const appState = reactive({
  currentUser: null as User | null,
  orders: [] as Order[],
  alerts: [] as Alert[],
  loading: false,
  error: ''
});

export function useAppStore() {
  const login = async (phone: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (data.success) {
        appState.currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const logout = () => {
    appState.currentUser = null;
    localStorage.removeItem('currentUser');
  };

  const loadOrders = async (filters: Record<string, string> = {}) => {
    appState.loading = true;
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/orders?${params}`);
      appState.orders = await response.json();
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      appState.loading = false;
    }
  };

  const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/detail`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Get order error:', error);
      return null;
    }
  };

  const createOrder = async (data: {
    customer_name: string;
    customer_phone: string;
    address: string;
    product_type: string;
    product_model: string;
    scheduled_time: string;
  }) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders?dispatcher_id=${appState.currentUser?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        await loadOrders();
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Create order error:', error);
      return null;
    } finally {
      appState.loading = false;
    }
  };

  const assignOrder = async (orderId: string, installerId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/assign?installer_id=${installerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Assign order error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const acceptOrder = async (orderId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/assign?installer_id=${appState.currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Accept order error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const startOrder = async (orderId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Start order error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const completeOrder = async (orderId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Complete order error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const addAccessory = async (orderId: string, name: string, quantity: number) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/accessories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, quantity })
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Add accessory error:', error);
      return null;
    } finally {
      appState.loading = false;
    }
  };

  const markAccessoryInstalled = async (accessoryId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/accessories/${accessoryId}/install`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Mark accessory installed error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const uploadPhoto = async (orderId: string, type: string, file: File) => {
    appState.loading = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('user_id', appState.currentUser?.id || '');
      
      const response = await fetch(`${API_BASE}/orders/${orderId}/photos`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Upload photo error:', error);
      return null;
    } finally {
      appState.loading = false;
    }
  };

  const reportLeakage = async (orderId: string, reason: string, description: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/rework?user_id=${appState.currentUser?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      });
      if (response.ok) {
        await loadOrders();
        await loadAlerts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Report leakage error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const acceptRework = async (reworkId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/reworks/${reworkId}/accept?installer_id=${appState.currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Accept rework error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const completeRework = async (reworkId: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/reworks/${reworkId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Complete rework error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const judgeResponsibility = async (orderId: string, result: string, evidence: string, compensationAmount: number, notes: string) => {
    appState.loading = true;
    try {
      const liabilityResultMap: Record<string, string> = {
        'technician': 'INSTALLER',
        'customer': 'USER',
        'supplier': 'MATERIAL',
        'company': 'UNKNOWN'
      };
      
      const response = await fetch(`${API_BASE}/orders/${orderId}/liability?handler_id=${appState.currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: liabilityResultMap[result] || 'UNKNOWN',
          evidence,
          compensation_amount: compensationAmount,
          notes
        })
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Judge responsibility error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const rejectResponsibility = async (liabilityId: string, reason: string, additionalEvidenceRequired: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/liabilities/${liabilityId}/reject?rejected_by=${appState.currentUser?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, additional_evidence_required: additionalEvidenceRequired })
      });
      if (response.ok) {
        await loadOrders();
        await loadAlerts();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Reject responsibility error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const askQuestion = async (orderId: string, question: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/question?asked_by=${appState.currentUser?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ask question error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    appState.loading = true;
    try {
      const response = await fetch(`${API_BASE}/questions/${questionId}/answer?answered_by=${appState.currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      if (response.ok) {
        await loadOrders();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Answer question error:', error);
      return false;
    } finally {
      appState.loading = false;
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/alerts`);
      appState.alerts = await response.json();
    } catch (error) {
      console.error('Load alerts error:', error);
    }
  };

  const markAlertRead = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Mark alert read error:', error);
    }
  };

  const getUsers = async (role?: string): Promise<User[]> => {
    try {
      const params = role ? `?role=${role.toUpperCase()}` : '';
      const response = await fetch(`${API_BASE}/users${params}`);
      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  };

  const init = async () => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      appState.currentUser = JSON.parse(stored);
    }
  };

  return {
    state: appState,
    login,
    logout,
    loadOrders,
    getOrder,
    createOrder,
    assignOrder,
    acceptOrder,
    startOrder,
    completeOrder,
    addAccessory,
    markAccessoryInstalled,
    uploadPhoto,
    reportLeakage,
    acceptRework,
    completeRework,
    judgeResponsibility,
    rejectResponsibility,
    askQuestion,
    answerQuestion,
    loadAlerts,
    markAlertRead,
    getUsers,
    init
  };
}
