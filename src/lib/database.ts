export interface Room {
  id: number
  name: string
  type: string
  price: number
  status: string
  capacity: number
}

export interface Reservation {
  id: number
  room_id: number
  guest_name: string
  phone: string
  check_in: string
  check_out: string
  guests: number
  deposit: number
  status: string
  created_at: string
}

export interface Order {
  id: number
  table_no: string
  dishes: string
  status: string
  created_at: string
}

export interface InventoryItem {
  id: number
  name: string
  quantity: number
  min_stock: number
  unit: string
}

export interface RoomStatusLog {
  id: number
  room_id: number
  status: string
  changed_by: string
  changed_at: string
  note: string
}

export interface User {
  id: number
  username: string
  password: string
  role: string
}

export async function login(username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await response.json();
}

export async function getAllRooms(): Promise<Room[]> {
  const response = await fetch('/api/rooms');
  return await response.json();
}

export async function getAllReservations(): Promise<Reservation[]> {
  const response = await fetch('/api/reservations');
  return await response.json();
}

export async function getAllOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  return await response.json();
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const response = await fetch('/api/inventory');
  return await response.json();
}

export async function getAllLogs(): Promise<RoomStatusLog[]> {
  const response = await fetch('/api/logs');
  return await response.json();
}

export async function addRoom(name: string, type: string, price: number, capacity: number): Promise<{ success: boolean }> {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, price, capacity })
  });
  return await response.json();
}

export async function updateRoomStatus(roomId: number, status: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/rooms', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: roomId, status })
  });
  return await response.json();
}

export async function addReservation(roomId: number, guestName: string, phone: string, checkIn: string, checkOut: string, guests: number, deposit: number): Promise<{ success: boolean }> {
  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, guest_name: guestName, phone, check_in: checkIn, check_out: checkOut, guests, deposit })
  });
  return await response.json();
}

export async function updateReservationStatus(reservationId: number, status: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/reservations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: reservationId, status })
  });
  return await response.json();
}

export async function addOrder(tableNo: string, dishes: string, deductStock: boolean = false): Promise<{ success: boolean; message?: string }> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_no: tableNo, dishes, deduct_stock: deductStock })
  });
  return await response.json();
}

export async function updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/orders', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: orderId, status })
  });
  return await response.json();
}

export async function updateInventoryStock(id: number, delta: number): Promise<{ success: boolean }> {
  const response = await fetch('/api/inventory', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, delta })
  });
  return await response.json();
}

export async function addStatusLog(roomId: number, status: string, changedBy: string, note: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, status, changed_by: changedBy, note })
  });
  return await response.json();
}

export async function batchAction(action: string, roomIds: number[], operator: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, roomIds, operator })
  });
  return await response.json();
}

export async function batchCheckIn(roomIds: number[], operator: string): Promise<{ success: boolean }> {
  return await batchAction('checkin', roomIds, operator);
}

export async function batchCheckOut(roomIds: number[], operator: string): Promise<{ success: boolean }> {
  return await batchAction('checkout', roomIds, operator);
}

export async function batchCleanComplete(roomIds: number[], operator: string): Promise<{ success: boolean }> {
  return await batchAction('cleanComplete', roomIds, operator);
}

export async function addInventoryItem(name: string, quantity: number, min_stock: number, unit: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, quantity, min_stock, unit })
  });
  return await response.json();
}

export async function deleteInventoryItem(id: number): Promise<{ success: boolean }> {
  const response = await fetch(`/api/inventory?id=${id}`, {
    method: 'DELETE'
  });
  return await response.json();
}

export async function getAllUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return await response.json();
}

export async function getRoomById(id: number): Promise<Room | null> {
  const response = await fetch(`/api/rooms?id=${id}`);
  const data = await response.json();
  return Object.keys(data).length > 0 ? data : null;
}

export async function resetData(): Promise<{ success: boolean }> {
  const response = await fetch('/api/reset', {
    method: 'POST'
  });
  return await response.json();
}

export function getUserFromStorage(): User | null {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}

export function setUserToStorage(user: User): void {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function removeUserFromStorage(): void {
  localStorage.removeItem('currentUser');
}