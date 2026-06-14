import type { Renewal, RenewalHistory, Communication, CommunicationHistory, RenewalFilter, CommunicationFilter } from '../types';

const BASE_URL = 'http://localhost:3001/api';

export async function fetchRenewals(filter?: RenewalFilter): Promise<Renewal[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.studentName) params.set('studentName', filter.studentName);
  
  const response = await fetch(`${BASE_URL}/renewals?${params}`);
  return response.json();
}

export async function fetchRenewalDetail(id: string): Promise<{ renewal: Renewal; history: RenewalHistory[] }> {
  const response = await fetch(`${BASE_URL}/renewals/${id}`);
  const data = await response.json();
  return { renewal: data, history: data.history };
}

export async function updateRenewalStatus(id: string, status: Renewal['status'], note?: string): Promise<{ renewal: Renewal; history: RenewalHistory[] }> {
  const response = await fetch(`${BASE_URL}/renewals/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note })
  });
  const data = await response.json();
  return { renewal: data, history: data.history };
}

export async function fetchCommunications(filter?: CommunicationFilter): Promise<Communication[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.priority) params.set('priority', filter.priority);
  if (filter?.studentName) params.set('studentName', filter.studentName);
  
  const response = await fetch(`${BASE_URL}/communications?${params}`);
  return response.json();
}

export async function fetchCommunicationDetail(id: string): Promise<{ communication: Communication; history: CommunicationHistory[] }> {
  const response = await fetch(`${BASE_URL}/communications/${id}`);
  const data = await response.json();
  return { communication: data, history: data.history };
}

export async function addCommunicationHistory(id: string, type: CommunicationHistory['type'], content: string): Promise<{ communication: Communication; history: CommunicationHistory[] }> {
  const response = await fetch(`${BASE_URL}/communications/${id}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content })
  });
  const data = await response.json();
  return { communication: data, history: data.history };
}

export async function updateCommunicationStatus(id: string, status: Communication['status']): Promise<Communication> {
  const response = await fetch(`${BASE_URL}/communications/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return response.json();
}
