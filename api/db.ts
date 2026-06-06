import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(__dirname, '..', 'data.json');

interface DataStore {
  students: any[];
  users: any[];
  keys_register: any[];
  late_return_records: any[];
  status_logs: any[];
}

let data: DataStore = {
  students: [],
  users: [],
  keys_register: [],
  late_return_records: [],
  status_logs: []
};

let nextRecordId = 1;
let nextLogId = 1;

export function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      data = JSON.parse(raw);
      nextRecordId = Math.max(0, ...data.late_return_records.map(r => r.id)) + 1;
      nextLogId = Math.max(0, ...data.status_logs.map(l => l.id)) + 1;
    }
  } catch (e) {
    console.log('加载数据失败，使用空数据');
  }
}

export function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getStudents() { return data.students; }
export function getUsers() { return data.users; }
export function getLateReturns() { return data.late_return_records; }
export function getStatusLogs() { return data.status_logs; }

export function insertStudent(s: any) { data.students.push(s); }
export function insertUser(u: any) { data.users.push(u); }
export function insertKey(k: any) { data.keys_register.push(k); }

export function insertLateReturn(r: any) {
  const id = nextRecordId++;
  const rec = { id, ...r, registered_at: new Date().toISOString() };
  data.late_return_records.push(rec);
  saveData();
  return id;
}

export function updateLateReturn(id: number, updates: any) {
  const i = data.late_return_records.findIndex(r => r.id === id);
  if (i >= 0) {
    data.late_return_records[i] = { ...data.late_return_records[i], ...updates };
    saveData();
  }
}

export function insertStatusLog(l: any) {
  const id = nextLogId++;
  const log = { id, ...l, created_at: new Date().toISOString() };
  data.status_logs.push(log);
  saveData();
  return id;
}

export function resetData() {
  data.late_return_records = [];
  data.status_logs = [];
  nextRecordId = 1;
  nextLogId = 1;
  saveData();
}

loadData();
