export interface Guest {
  id: number;
  name: string;
  stage_name?: string;
  phone?: string;
  email?: string;
  genre?: string;
  agent_name?: string;
  agent_phone?: string;
  description?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface Performance {
  id: number;
  guest_id: number;
  date: string;
  start_time: string;
  end_time: string;
  stage: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface Reservation {
  id: number;
  customer_name: string;
  phone: string;
  date: string;
  time_slot: string;
  table_number: number;
  guests_count: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface WineStorage {
  id: number;
  customer_name: string;
  phone: string;
  wine_name: string;
  quantity: number;
  bottle_size: string;
  storage_location: string;
  status: 'stored' | 'retrieved' | 'consumed';
  stored_at: string;
  retrieved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface OperationLog {
  id: number;
  table_name: string;
  record_id: number;
  operation: 'create' | 'update' | 'delete';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  operator_id: number;
  operator_name: string;
  notes?: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  table_name: string;
  record_id: number;
  file_name: string;
  file_path?: string;
  file_type?: string;
  description?: string;
  uploaded_at: string;
  uploaded_by: number;
}

export async function fetchGuests(): Promise<Guest[]> {
  const response = await fetch('/api/guests');
  const { guests } = await response.json();
  return guests;
}

export async function createGuest(data: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const response = await fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const { id } = await response.json();
  return id;
}

export async function updateGuest(id: number, data: Partial<Guest>): Promise<void> {
  await fetch(`/api/guests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deleteGuest(id: number): Promise<void> {
  await fetch(`/api/guests/${id}`, { method: 'DELETE' });
}

export async function fetchPerformances(date?: string): Promise<Performance[]> {
  const url = date ? `/api/performances?date=${date}` : '/api/performances';
  const response = await fetch(url);
  const { performances } = await response.json();
  return performances;
}

export async function createPerformance(data: Omit<Performance, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const response = await fetch('/api/performances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const { id } = await response.json();
  return id;
}

export async function updatePerformance(id: number, data: Partial<Performance>): Promise<void> {
  await fetch(`/api/performances/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deletePerformance(id: number): Promise<void> {
  await fetch(`/api/performances/${id}`, { method: 'DELETE' });
}

export async function fetchReservations(date?: string): Promise<Reservation[]> {
  const url = date ? `/api/reservations?date=${date}` : '/api/reservations';
  const response = await fetch(url);
  const { reservations } = await response.json();
  return reservations;
}

export async function createReservation(data: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: number; success: boolean; message?: string }> {
  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.status === 409) {
    const { message } = await response.json();
    return { id: 0, success: false, message };
  }
  
  const { id } = await response.json();
  return { id, success: true };
}

export async function updateReservation(id: number, data: Partial<Reservation>): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`/api/reservations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.status === 409) {
    const { message } = await response.json();
    return { success: false, message };
  }
  
  return { success: true };
}

export async function deleteReservation(id: number): Promise<void> {
  await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
}

export async function fetchWineStorage(phone?: string, storedOnly?: boolean): Promise<WineStorage[]> {
  let url = '/api/wine-storage';
  if (phone) url += `?phone=${phone}`;
  else if (storedOnly) url += '?stored=true';
  const response = await fetch(url);
  const { wines } = await response.json();
  return wines;
}

export async function createWineStorage(data: Omit<WineStorage, 'id' | 'created_at' | 'updated_at' | 'stored_at'>): Promise<number> {
  const response = await fetch('/api/wine-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const { id } = await response.json();
  return id;
}

export async function retrieveWine(id: number, notes?: string): Promise<void> {
  await fetch(`/api/wine-storage/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'retrieve', notes })
  });
}

export async function updateWineStorage(id: number, data: Partial<WineStorage>): Promise<void> {
  await fetch(`/api/wine-storage/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deleteWineStorage(id: number): Promise<void> {
  await fetch(`/api/wine-storage/${id}`, { method: 'DELETE' });
}

export async function fetchLogs(table?: string, recordId?: number): Promise<OperationLog[]> {
  let url = '/api/logs';
  if (table && recordId) url += `?table=${table}&recordId=${recordId}`;
  else if (table) url += `?table=${table}`;
  const response = await fetch(url);
  const { logs } = await response.json();
  return logs;
}

export async function fetchAttachments(table?: string, recordId?: number): Promise<Attachment[]> {
  let url = '/api/attachments';
  if (table && recordId) url += `?table=${table}&recordId=${recordId}`;
  const response = await fetch(url);
  const { attachments } = await response.json();
  return attachments;
}

export async function createAttachment(data: Omit<Attachment, 'id' | 'uploaded_at'>): Promise<number> {
  const response = await fetch('/api/attachments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const { id } = await response.json();
  return id;
}

export async function deleteAttachment(id: number): Promise<void> {
  await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
}
