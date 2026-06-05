import { db } from '../db/memoryDb.js';
import type {
  Compensation,
  CompensationStatus,
  CreateCompensationRequest,
} from '../../shared/types.js';

export class CompensationRepository {
  create(complaintId: string, data: CreateCompensationRequest): Compensation {
    return db.compensations.create(complaintId, data);
  }

  findById(id: string): Compensation | null {
    return null;
  }

  findByComplaintId(complaintId: string): Compensation[] {
    return db.compensations.findByComplaintId(complaintId);
  }

  updateStatus(
    id: string,
    status: CompensationStatus,
    approvedBy?: string,
    rejectReason?: string
  ): void {
    db.compensations.updateStatus(id, status as any, approvedBy, rejectReason);
  }
}

export default new CompensationRepository();
