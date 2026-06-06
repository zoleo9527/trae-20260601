import { v4 as uuidv4 } from 'uuid';
import {
    BrandDemand,
    CaseRecord,
    ScriptVersion,
    StatusLog,
    Talent,
    TodoItem,
    User
} from '../types';

class Database {
  users: User[] = [];
  talents: Talent[] = [];
  brandDemands: BrandDemand[] = [];
  scriptVersions: ScriptVersion[] = [];
  caseRecords: CaseRecord[] = [];
  todoItems: TodoItem[] = [];
  statusLogs: StatusLog[] = [];

  generateId(): string {
    return uuidv4();
  }

  reset() {
    this.users = [];
    this.talents = [];
    this.brandDemands = [];
    this.scriptVersions = [];
    this.caseRecords = [];
    this.todoItems = [];
    this.statusLogs = [];
  }
}

export const db = new Database();
