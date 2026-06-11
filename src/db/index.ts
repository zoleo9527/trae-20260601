const DB_PREFIX = 'ipcrm_';

function makeKey(table: string, id: string) {
  return `${DB_PREFIX}${table}:${id}`;
}

function makeListKey(table: string) {
  return `${DB_PREFIX}${table}_list`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export interface DbUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface DbLead {
  id: string;
  company_name: string;
  contact_person: string;
  contact_phone: string;
  industry: string;
  required_area: number;
  budget: number;
  status: string;
  source_type: string;
  source_reference: string;
  source_uploaded_at: string;
  source_uploaded_by: string;
  assigned_to: string | null;
  assigned_role: string | null;
  assigned_at: string | null;
  current_responsible: string | null;
  current_responsible_role: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  priority: string;
  tags: string;
  remark: string;
  has_exception: number;
  exception_type: string | null;
  exception_message: string | null;
  exception_at: string | null;
}

export interface DbFollowup {
  id: string;
  lead_id: string;
  type: string;
  content: string;
  location: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  handled_by: string;
  handled_role: string;
  next_action: string;
  next_action_at: string | null;
  next_responsible: string | null;
  next_responsible_role: string | null;
  created_at: string;
  updated_at: string;
  attachments: string;
}

export interface DbTransition {
  id: string;
  lead_id: string;
  followup_id: string | null;
  from_status: string | null;
  to_status: string;
  from_followup_status: string | null;
  to_followup_status: string | null;
  from_responsible: string | null;
  to_responsible: string | null;
  from_responsible_role: string | null;
  to_responsible_role: string | null;
  transitioned_at: string;
  transitioned_by: string;
  transitioned_by_role: string;
  remark: string;
  is_gap_detected: number;
  gap_duration_minutes: number;
}

export interface DbException {
  id: string;
  lead_id: string;
  followup_id: string | null;
  type: string;
  message: string;
  detected_at: string;
  handled: number;
  handled_at: string | null;
  handled_by: string | null;
  handled_remark: string | null;
  triggered_by_transition_id: string | null;
}

function getAll<T>(table: string): T[] {
  return readJson<T[]>(makeListKey(table), []);
}

function setAll<T>(table: string, items: T[]) {
  writeJson(makeListKey(table), items);
}

function getById<T extends { id: string }>(table: string, id: string): T | undefined {
  return getAll<T>(table).find((item) => item.id === id);
}

function upsert<T extends { id: string }>(table: string, item: T) {
  const items = getAll<T>(table);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  setAll(table, items);
}

function updateById<T extends { id: string }>(table: string, id: string, updates: Partial<T>) {
  const items = getAll<T>(table);
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...updates };
    setAll(table, items);
  }
}

function getWhere<T>(table: string, predicate: (item: T) => boolean): T[] {
  return getAll<T>(table).filter(predicate);
}

let initialized = false;

export async function getDb() {
  if (!initialized) {
    await initSeedData();
    initialized = true;
  }
}

async function initSeedData() {
  const users = getAll<DbUser>('users');
  if (users.length === 0) {
    setAll<DbUser>('users', [
      { id: 'user_1', name: '张经理', role: 'manager' },
      { id: 'user_2', name: '李主管', role: 'supervisor' },
      { id: 'user_3', name: '王物业', role: 'property' },
      { id: 'user_4', name: '赵工程', role: 'engineering' },
    ]);
  }

  const settings = readJson<Record<string, string>>(`${DB_PREFIX}settings`, {});
  if (!settings['current_user_id']) {
    settings['current_user_id'] = 'user_1';
    writeJson(`${DB_PREFIX}settings`, settings);
  }
}

export async function closeDb() {}

export async function executeRawSql(_sql: string, _params: any[] = []): Promise<void> {}

export async function getCurrentUser(): Promise<DbUser> {
  await getDb();
  const settings = readJson<Record<string, string>>(`${DB_PREFIX}settings`, {});
  const userId = settings['current_user_id'] || 'user_1';
  const user = getById<DbUser>('users', userId);
  return user || { id: 'user_1', name: '张经理', role: 'manager' };
}

export async function setCurrentUser(userId: string): Promise<void> {
  const settings = readJson<Record<string, string>>(`${DB_PREFIX}settings`, {});
  settings['current_user_id'] = userId;
  writeJson(`${DB_PREFIX}settings`, settings);
}

export async function getAllUsers(): Promise<DbUser[]> {
  await getDb();
  return getAll<DbUser>('users');
}

export async function getUsersByRole(role: string): Promise<DbUser[]> {
  await getDb();
  return getWhere<DbUser>('users', (u) => u.role === role);
}

export async function insertLead(lead: DbLead): Promise<string> {
  await getDb();
  upsert('leads', lead);
  return lead.id;
}

export async function updateLead(id: string, updates: Partial<DbLead>): Promise<void> {
  await getDb();
  updateById<DbLead>('leads', id, { ...updates, updated_at: new Date().toISOString() });
}

export async function getLeadById(id: string): Promise<DbLead | null> {
  await getDb();
  return getById<DbLead>('leads', id) || null;
}

export async function getLeads(filter: {
  status?: string[];
  assignedTo?: string;
  currentResponsible?: string;
  hasException?: boolean;
  priority?: string[];
  keyword?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ data: DbLead[]; total: number }> {
  await getDb();
  let items = getAll<DbLead>('leads');

  if (filter.status?.length) {
    items = items.filter((i) => filter.status!.includes(i.status));
  }
  if (filter.assignedTo) {
    items = items.filter((i) => i.assigned_to === filter.assignedTo);
  }
  if (filter.currentResponsible) {
    items = items.filter((i) => i.current_responsible === filter.currentResponsible);
  }
  if (filter.hasException !== undefined) {
    items = items.filter((i) => i.has_exception === (filter.hasException ? 1 : 0));
  }
  if (filter.priority?.length) {
    items = items.filter((i) => filter.priority!.includes(i.priority));
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    items = items.filter(
      (i) =>
        i.company_name.toLowerCase().includes(kw) ||
        i.contact_person.toLowerCase().includes(kw) ||
        i.contact_phone.includes(kw) ||
        (i.industry && i.industry.toLowerCase().includes(kw))
    );
  }

  items.sort((a, b) => {
    if (a.has_exception !== b.has_exception) return b.has_exception - a.has_exception;
    const pOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return b.created_at.localeCompare(a.created_at);
  });

  const total = items.length;
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 50;
  const data = items.slice((page - 1) * pageSize, page * pageSize);

  return { data, total };
}

export async function insertFollowup(followup: DbFollowup): Promise<string> {
  await getDb();
  upsert('followups', followup);
  return followup.id;
}

export async function updateFollowup(id: string, updates: Partial<DbFollowup>): Promise<void> {
  await getDb();
  updateById<DbFollowup>('followups', id, { ...updates, updated_at: new Date().toISOString() });
}

export async function getFollowupsByLeadId(leadId: string): Promise<DbFollowup[]> {
  await getDb();
  return getWhere<DbFollowup>('followups', (f) => f.lead_id === leadId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getAllFollowups(limit?: number): Promise<DbFollowup[]> {
  await getDb();
  let items = getAll<DbFollowup>('followups').sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  if (limit && limit > 0) {
    items = items.slice(0, limit);
  }
  return items;
}

export async function insertTransition(transition: DbTransition): Promise<string> {
  await getDb();
  upsert('transitions', transition);
  return transition.id;
}

export async function updateTransition(id: string, updates: Partial<DbTransition>): Promise<void> {
  await getDb();
  updateById<DbTransition>('transitions', id, updates);
}

export async function getLastTransitionByLeadId(leadId: string): Promise<DbTransition | null> {
  await getDb();
  const items = getWhere<DbTransition>('transitions', (t) => t.lead_id === leadId)
    .sort((a, b) => b.transitioned_at.localeCompare(a.transitioned_at));
  return items[0] || null;
}

export async function getTransitionsByLeadId(leadId: string): Promise<DbTransition[]> {
  await getDb();
  return getWhere<DbTransition>('transitions', (t) => t.lead_id === leadId)
    .sort((a, b) => a.transitioned_at.localeCompare(b.transitioned_at));
}

export async function insertException(exception: DbException): Promise<string> {
  await getDb();
  upsert('exceptions', exception);
  return exception.id;
}

export async function updateException(id: string, updates: Partial<DbException>): Promise<void> {
  await getDb();
  updateById<DbException>('exceptions', id, updates);
}

export async function getUnhandledExceptions(leadId?: string): Promise<DbException[]> {
  await getDb();
  let items = getWhere<DbException>('exceptions', (e) => e.handled === 0);
  if (leadId) {
    items = items.filter((e) => e.lead_id === leadId);
  }
  return items.sort((a, b) => b.detected_at.localeCompare(a.detected_at));
}

export async function getExceptionsByLeadId(leadId: string): Promise<DbException[]> {
  await getDb();
  return getWhere<DbException>('exceptions', (e) => e.lead_id === leadId)
    .sort((a, b) => b.detected_at.localeCompare(a.detected_at));
}

export async function getExceptionStats(): Promise<{
  total: number;
  byType: Record<string, number>;
}> {
  await getDb();
  const items = getWhere<DbException>('exceptions', (e) => e.handled === 0);
  const byType: Record<string, number> = {};
  for (const e of items) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  return { total: items.length, byType };
}
