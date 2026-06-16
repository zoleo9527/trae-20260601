import type { RequestHandler } from '@sveltejs/kit';
import { initDatabase } from '../db/init';
import { validateUser } from '../db/users';
import { getAllGuests, getGuestById, createGuest, updateGuest, deleteGuest } from '../db/guests';
import { getAllPerformances, getPerformanceById, getPerformancesByDate, createPerformance, updatePerformance, deletePerformance } from '../db/performances';
import { getAllReservations, getReservationById, getReservationsByDate, checkDuplicateReservation, createReservation, updateReservation, deleteReservation } from '../db/reservations';
import { getAllWineStorage, getWineStorageById, getWineStorageByPhone, getStoredWines, createWineStorage, retrieveWine, updateWineStorage, deleteWineStorage } from '../db/wine_storage';
import { getAllLogs, getLogsByTable, getLogsByRecord, createLog } from '../db/operation_logs';
import { getAllAttachments, getAttachmentsByRecord, createAttachment, deleteAttachment } from '../db/attachments';

initDatabase();

declare global {
  namespace App {
    interface Locals {
      user: { id: number; username: string; role: string } | null;
    }
  }
}

export async function handleAuth(request: Request): Promise<{ user: { id: number; username: string; role: string } | null }> {
  const sessionCookie = request.headers.get('cookie');
  if (!sessionCookie) {
    return { user: null };
  }
  
  const match = sessionCookie.match(/user=([^;]+)/);
  if (!match) {
    return { user: null };
  }
  
  try {
    const decoded = Buffer.from(match[1], 'base64').toString();
    const [id, username, role] = decoded.split('|');
    return { user: { id: parseInt(id), username, role } };
  } catch {
    return { user: null };
  }
}

export const login: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { username, password } = body;
  
  const user = validateUser(username, password);
  
  if (!user) {
    return { status: 401, body: { message: 'Invalid credentials' } };
  }
  
  const session = Buffer.from(`${user.id}|${user.username}|${user.role}`).toString('base64');
  return {
    status: 200,
    headers: {
      'Set-Cookie': `user=${session}; HttpOnly; Path=/`
    },
    body: { user: { id: user.id, username: user.username, role: user.role } }
  };
};

export const getCurrentUser: RequestHandler = async ({ request }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }
  return { status: 200, body: { user } };
};

export const logout: RequestHandler = () => {
  return {
    status: 200,
    headers: {
      'Set-Cookie': 'user=; HttpOnly; Path=/; Max-Age=0'
    },
    body: { message: 'Logged out' }
  };
};

export const guests: RequestHandler = async ({ request }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  if (request.method === 'GET') {
    const guests = getAllGuests();
    return { status: 200, body: { guests } };
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const id = createGuest({ ...body, created_by: user.id, updated_by: user.id });
    createLog({
      table_name: 'guests',
      record_id: id,
      operation: 'create',
      operator_id: user.id,
      operator_name: user.username,
      notes: `Created guest: ${body.name}`
    });
    return { status: 201, body: { id } };
  }

  return { status: 405 };
};

export const guestById: RequestHandler = async ({ request, params }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  const id = parseInt(params.id);

  if (request.method === 'GET') {
    const guest = getGuestById(id);
    return guest ? { status: 200, body: { guest } } : { status: 404 };
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    const oldGuest = getGuestById(id);
    updateGuest(id, body, user.id);
    
    if (oldGuest) {
      const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];
      if (body.name !== undefined && body.name !== oldGuest.name) changes.push({ field_name: 'name', old_value: oldGuest.name, new_value: body.name });
      if (body.status !== undefined && body.status !== oldGuest.status) changes.push({ field_name: 'status', old_value: oldGuest.status, new_value: body.status });
      changes.forEach(change => {
        createLog({
          table_name: 'guests',
          record_id: id,
          operation: 'update',
          field_name: change.field_name,
          old_value: change.old_value,
          new_value: change.new_value,
          operator_id: user.id,
          operator_name: user.username
        });
      });
    }
    
    return { status: 200 };
  }

  if (request.method === 'DELETE') {
    deleteGuest(id);
    createLog({
      table_name: 'guests',
      record_id: id,
      operation: 'delete',
      operator_id: user.id,
      operator_name: user.username,
      notes: 'Deleted guest'
    });
    return { status: 200 };
  }

  return { status: 405 };
};

export const performances: RequestHandler = async ({ request, url }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  if (request.method === 'GET') {
    const date = url.searchParams.get('date');
    const performances = date ? getPerformancesByDate(date) : getAllPerformances();
    return { status: 200, body: { performances } };
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const id = createPerformance({ ...body, created_by: user.id, updated_by: user.id });
    createLog({
      table_name: 'performances',
      record_id: id,
      operation: 'create',
      operator_id: user.id,
      operator_name: user.username,
      notes: `Created performance for guest ${body.guest_id}`
    });
    return { status: 201, body: { id } };
  }

  return { status: 405 };
};

export const performanceById: RequestHandler = async ({ request, params }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  const id = parseInt(params.id);

  if (request.method === 'GET') {
    const performance = getPerformanceById(id);
    return performance ? { status: 200, body: { performance } } : { status: 404 };
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    const oldPerformance = getPerformanceById(id);
    updatePerformance(id, body, user.id);
    
    if (oldPerformance) {
      const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];
      if (body.date !== undefined && body.date !== oldPerformance.date) changes.push({ field_name: 'date', old_value: oldPerformance.date, new_value: body.date });
      if (body.status !== undefined && body.status !== oldPerformance.status) changes.push({ field_name: 'status', old_value: oldPerformance.status, new_value: body.status });
      if (body.start_time !== undefined && body.start_time !== oldPerformance.start_time) changes.push({ field_name: 'start_time', old_value: oldPerformance.start_time, new_value: body.start_time });
      changes.forEach(change => {
        createLog({
          table_name: 'performances',
          record_id: id,
          operation: 'update',
          field_name: change.field_name,
          old_value: change.old_value,
          new_value: change.new_value,
          operator_id: user.id,
          operator_name: user.username,
          notes: body.notes
        });
      });
    }
    
    return { status: 200 };
  }

  if (request.method === 'DELETE') {
    deletePerformance(id);
    createLog({
      table_name: 'performances',
      record_id: id,
      operation: 'delete',
      operator_id: user.id,
      operator_name: user.username,
      notes: 'Deleted performance'
    });
    return { status: 200 };
  }

  return { status: 405 };
};

export const reservations: RequestHandler = async ({ request, url }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  if (request.method === 'GET') {
    const date = url.searchParams.get('date');
    const reservations = date ? getReservationsByDate(date) : getAllReservations();
    return { status: 200, body: { reservations } };
  }

  if (request.method === 'POST') {
    const body = await request.json();
    
    if (checkDuplicateReservation(body.date, body.table_number, body.time_slot)) {
      return { status: 409, body: { message: 'Table already reserved' } };
    }
    
    const id = createReservation({ ...body, created_by: user.id, updated_by: user.id });
    createLog({
      table_name: 'reservations',
      record_id: id,
      operation: 'create',
      operator_id: user.id,
      operator_name: user.username,
      notes: `Reserved table ${body.table_number} for ${body.customer_name}`
    });
    return { status: 201, body: { id } };
  }

  return { status: 405 };
};

export const reservationById: RequestHandler = async ({ request, params }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  const id = parseInt(params.id);

  if (request.method === 'GET') {
    const reservation = getReservationById(id);
    return reservation ? { status: 200, body: { reservation } } : { status: 404 };
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    const oldReservation = getReservationById(id);
    
    if (oldReservation && body.table_number !== undefined && body.date !== undefined && body.time_slot !== undefined) {
      if (checkDuplicateReservation(body.date, body.table_number, body.time_slot)) {
        return { status: 409, body: { message: 'Table already reserved' } };
      }
    }
    
    updateReservation(id, body, user.id);
    
    if (oldReservation) {
      const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];
      if (body.status !== undefined && body.status !== oldReservation.status) changes.push({ field_name: 'status', old_value: oldReservation.status, new_value: body.status });
      if (body.table_number !== undefined && body.table_number !== oldReservation.table_number) changes.push({ field_name: 'table_number', old_value: String(oldReservation.table_number), new_value: String(body.table_number) });
      changes.forEach(change => {
        createLog({
          table_name: 'reservations',
          record_id: id,
          operation: 'update',
          field_name: change.field_name,
          old_value: change.old_value,
          new_value: change.new_value,
          operator_id: user.id,
          operator_name: user.username,
          notes: body.notes
        });
      });
    }
    
    return { status: 200 };
  }

  if (request.method === 'DELETE') {
    deleteReservation(id);
    createLog({
      table_name: 'reservations',
      record_id: id,
      operation: 'delete',
      operator_id: user.id,
      operator_name: user.username,
      notes: 'Deleted reservation'
    });
    return { status: 200 };
  }

  return { status: 405 };
};

export const wineStorage: RequestHandler = async ({ request, url }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  if (request.method === 'GET') {
    const phone = url.searchParams.get('phone');
    const storedOnly = url.searchParams.get('stored') === 'true';
    const wines = storedOnly ? getStoredWines() : (phone ? getWineStorageByPhone(phone) : getAllWineStorage());
    return { status: 200, body: { wines } };
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const id = createWineStorage({ ...body, created_by: user.id, updated_by: user.id });
    createLog({
      table_name: 'wine_storage',
      record_id: id,
      operation: 'create',
      operator_id: user.id,
      operator_name: user.username,
      notes: `Stored wine: ${body.wine_name} for ${body.customer_name}`
    });
    return { status: 201, body: { id } };
  }

  return { status: 405 };
};

export const wineStorageById: RequestHandler = async ({ request, params }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  const id = parseInt(params.id);

  if (request.method === 'GET') {
    const wine = getWineStorageById(id);
    return wine ? { status: 200, body: { wine } } : { status: 404 };
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    
    if (body.action === 'retrieve') {
      const oldWine = getWineStorageById(id);
      retrieveWine(id, user.id, body.notes);
      
      if (oldWine) {
        createLog({
          table_name: 'wine_storage',
          record_id: id,
          operation: 'update',
          field_name: 'status',
          old_value: oldWine.status,
          new_value: 'retrieved',
          operator_id: user.id,
          operator_name: user.username,
          notes: body.notes || 'Wine retrieved'
        });
      }
    } else {
      const oldWine = getWineStorageById(id);
      updateWineStorage(id, body, user.id);
      
      if (oldWine) {
        const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];
        if (body.status !== undefined && body.status !== oldWine.status) changes.push({ field_name: 'status', old_value: oldWine.status, new_value: body.status });
        changes.forEach(change => {
          createLog({
            table_name: 'wine_storage',
            record_id: id,
            operation: 'update',
            field_name: change.field_name,
            old_value: change.old_value,
            new_value: change.new_value,
            operator_id: user.id,
            operator_name: user.username
          });
        });
      }
    }
    
    return { status: 200 };
  }

  if (request.method === 'DELETE') {
    deleteWineStorage(id);
    createLog({
      table_name: 'wine_storage',
      record_id: id,
      operation: 'delete',
      operator_id: user.id,
      operator_name: user.username,
      notes: 'Deleted wine storage'
    });
    return { status: 200 };
  }

  return { status: 405 };
};

export const logs: RequestHandler = async ({ request, url }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  if (request.method === 'GET') {
    const table = url.searchParams.get('table');
    const recordId = url.searchParams.get('recordId');
    
    let logs;
    if (table && recordId) {
      logs = getLogsByRecord(table, parseInt(recordId));
    } else if (table) {
      logs = getLogsByTable(table);
    } else {
      logs = getAllLogs();
    }
    
    return { status: 200, body: { logs } };
  }

  return { status: 405 };
};

export const attachments: RequestHandler = async ({ request, url }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  if (request.method === 'GET') {
    const table = url.searchParams.get('table');
    const recordId = url.searchParams.get('recordId');
    
    const attachments = table && recordId 
      ? getAttachmentsByRecord(table, parseInt(recordId))
      : getAllAttachments();
    
    return { status: 200, body: { attachments } };
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const id = createAttachment({ ...body, uploaded_by: user.id });
    return { status: 201, body: { id } };
  }

  return { status: 405 };
};

export const attachmentById: RequestHandler = async ({ request, params }) => {
  const { user } = await handleAuth(request);
  if (!user) {
    return { status: 401, body: { message: 'Not authenticated' } };
  }

  const id = parseInt(params.id);

  if (request.method === 'DELETE') {
    deleteAttachment(id);
    return { status: 200 };
  }

  return { status: 405 };
};
