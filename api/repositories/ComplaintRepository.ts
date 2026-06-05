import { db, generateComplaintNo } from '../db/memoryDb.js';
import type {
  Complaint,
  ComplaintStatus,
  CreateComplaintRequest,
  UserRole,
} from '../../shared/types.js';

export class ComplaintRepository {
  create(data: CreateComplaintRequest, handlerRole: UserRole, handlerName: string): Complaint {
    return db.complaints.create(data, handlerRole, handlerName);
  }

  findById(id: string): Complaint | null {
    return db.complaints.findById(id);
  }

  findAll(filters?: { status?: string; type?: string }): Complaint[] {
    return db.complaints.findAll(filters);
  }

  findByHandlerRole(role: UserRole): Complaint[] {
    return db.complaints.findByHandlerRole(role);
  }

  updateStatus(id: string, status: ComplaintStatus, handlerRole: UserRole, handlerName: string): void {
    db.complaints.updateStatus(id, status, handlerRole, handlerName);
  }

  update(id: string, data: Partial<CreateComplaintRequest>): void {
    db.complaints.update(id, data);
  }
}

export default new ComplaintRepository();
export { generateComplaintNo };
