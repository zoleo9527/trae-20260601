import {
  User, Client, Project, WorkflowRecord, Todo, UserRole, WorkflowStage
} from './types';

class DataStore {
  users: Map<string, User> = new Map();
  clients: Map<string, Client> = new Map();
  projects: Map<string, Project> = new Map();
  records: Map<string, WorkflowRecord> = new Map();
  todos: Map<string, Todo> = new Map();

  clear(): void {
    this.users.clear();
    this.clients.clear();
    this.projects.clear();
    this.records.clear();
    this.todos.clear();
  }
}

export const dataStore = new DataStore();

export function initializeData(
  users: User[],
  clients: Client[],
  projects: Project[],
  records: WorkflowRecord[],
  todos: Todo[]
): void {
  dataStore.clear();

  users.forEach(user => dataStore.users.set(user.id, user));
  clients.forEach(client => dataStore.clients.set(client.id, client));
  projects.forEach(project => dataStore.projects.set(project.id, project));
  records.forEach(record => dataStore.records.set(record.id, record));
  todos.forEach(todo => dataStore.todos.set(todo.id, todo));
}

export function getUserById(id: string): User | undefined {
  return dataStore.users.get(id);
}

export function getUsersByRole(role: UserRole): User[] {
  return Array.from(dataStore.users.values()).filter(u => u.role === role);
}

export function getClientById(id: string): Client | undefined {
  return dataStore.clients.get(id);
}

export function getProjectById(id: string): Project | undefined {
  return dataStore.projects.get(id);
}

export function getRecordById(id: string): WorkflowRecord | undefined {
  return dataStore.records.get(id);
}

export function getRecordsByProject(projectId: string): WorkflowRecord[] {
  return Array.from(dataStore.records.values()).filter(r => r.projectId === projectId);
}

export function getRecordsByClient(clientId: string): WorkflowRecord[] {
  return Array.from(dataStore.records.values()).filter(r => r.clientId === clientId);
}

export function getAllRecords(): WorkflowRecord[] {
  return Array.from(dataStore.records.values());
}

export function saveRecord(record: WorkflowRecord): void {
  dataStore.records.set(record.id, record);
}

export function getTodosByAssignee(assigneeId: string): Todo[] {
  return Array.from(dataStore.todos.values()).filter(t => t.assigneeId === assigneeId);
}

export function getTodosByRole(role: UserRole): Todo[] {
  return Array.from(dataStore.todos.values()).filter(t => t.assigneeRole === role);
}

export function getAllTodos(): Todo[] {
  return Array.from(dataStore.todos.values());
}

export function saveTodo(todo: Todo): void {
  dataStore.todos.set(todo.id, todo);
}

export function deleteTodo(id: string): boolean {
  return dataStore.todos.delete(id);
}
