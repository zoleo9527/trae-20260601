import { User, GroupTicket, TodoItem, StatusLog, UserRole } from '../types';

export interface Database {
  users: User[];
  tickets: GroupTicket[];
  todos: TodoItem[];
  statusLogs: StatusLog[];
}

export const db: Database = {
  users: [],
  tickets: [],
  todos: [],
  statusLogs: [],
};

export function getUserById(id: string): User | undefined {
  return db.users.find(u => u.id === id);
}

export function getUserByRole(role: UserRole): User | undefined {
  return db.users.find(u => u.role === role);
}

export function getTicketById(id: string): GroupTicket | undefined {
  return db.tickets.find(t => t.id === id);
}

export function getTodosByRole(role: UserRole): TodoItem[] {
  return db.todos.filter(t => t.role === role);
}

export function getStatusLogsByTicketId(ticketId: string): StatusLog[] {
  return db.statusLogs.filter(l => l.ticketId === ticketId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
