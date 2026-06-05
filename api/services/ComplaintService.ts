import complaintRepository from '../repositories/ComplaintRepository.js';
import actionLogRepository from '../repositories/ActionLogRepository.js';
import compensationRepository from '../repositories/CompensationRepository.js';
import type {
  Complaint,
  ActionRequest,
  CreateComplaintRequest,
  CreateCompensationRequest,
  UserRole,
  ActionType,
  ComplaintStatus,
} from '../../shared/types.js';

class ComplaintService {
  getComplaintWithDetails(id: string): Complaint | null {
    const complaint = complaintRepository.findById(id);
    if (!complaint) return null;

    complaint.actionLogs = actionLogRepository.findByComplaintId(id);
    complaint.compensations = compensationRepository.findByComplaintId(id);

    return complaint;
  }

  getAllComplaints(filters?: { status?: string; type?: string }): Complaint[] {
    const complaints = complaintRepository.findAll(filters);
    return complaints.map((c) => ({
      ...c,
      actionLogs: actionLogRepository.findByComplaintId(c.id),
      compensations: compensationRepository.findByComplaintId(c.id),
    }));
  }

  getTodosByRole(role: UserRole): Complaint[] {
    const complaints = complaintRepository.findByHandlerRole(role);
    return complaints.map((c) => ({
      ...c,
      actionLogs: actionLogRepository.findByComplaintId(c.id),
      compensations: compensationRepository.findByComplaintId(c.id),
    }));
  }

  createComplaint(
    data: CreateComplaintRequest,
    handlerRole: UserRole,
    handlerName: string
  ): Complaint {
    const complaint = complaintRepository.create(data, handlerRole, handlerName);

    actionLogRepository.create(complaint.id, {
      actionType: 'create',
      operatorRole: handlerRole,
      operatorName: handlerName,
      remark: '创建投诉记录',
    });

    return this.getComplaintWithDetails(complaint.id)!;
  }

  executeAction(id: string, action: ActionRequest): Complaint | null {
    const complaint = complaintRepository.findById(id);
    if (!complaint) return null;

    const validTransitions: Record<ActionType, ComplaintStatus[]> = {
      submit: ['draft'],
      review_approve: ['pending_review'],
      review_reject: ['pending_review'],
      resubmit: ['review_rejected'],
      compensation_propose: ['pending_compensation', 'compensation_rejected'],
      compensation_approve: ['pending_compensation'],
      compensation_reject: ['pending_compensation'],
      complete: ['pending_compensation', 'completed'],
      create: [],
      note: [],
    };

    const allowedStatuses = validTransitions[action.actionType];
    if (allowedStatuses && allowedStatuses.length > 0 && !allowedStatuses.includes(complaint.status)) {
      throw new Error(
        `当前状态 "${complaint.status}" 不允许执行操作 "${action.actionType}"`
      );
    }

    actionLogRepository.create(id, action);

    const statusMap: Record<ActionType, { status: string; role: UserRole; name: string } | null> = {
      submit: { status: 'pending_review', role: 'manager', name: '值班店长' },
      review_approve: { status: 'pending_compensation', role: 'reception', name: '场馆前台' },
      review_reject: { status: 'review_rejected', role: 'reception', name: '场馆前台' },
      resubmit: { status: 'pending_review', role: 'manager', name: '值班店长' },
      compensation_propose: null,
      compensation_approve: { status: 'completed', role: 'manager', name: action.operatorName },
      compensation_reject: { status: 'compensation_rejected', role: 'reception', name: '场馆前台' },
      complete: { status: 'completed', role: 'manager', name: action.operatorName },
      create: null,
      note: null,
    };

    const transition = statusMap[action.actionType];
    if (transition) {
      complaintRepository.updateStatus(
        id,
        transition.status as any,
        transition.role,
        transition.name
      );
    }

    if (action.actionType === 'compensation_approve' || action.actionType === 'compensation_reject') {
      const compensations = compensationRepository.findByComplaintId(id);
      const pendingComp = compensations.find((c) => c.status === 'pending');
      if (pendingComp) {
        compensationRepository.updateStatus(
          pendingComp.id,
          action.actionType === 'compensation_approve' ? 'approved' : 'rejected',
          action.operatorName,
          action.rejectReason
        );
      }
    }

    return this.getComplaintWithDetails(id);
  }

  proposeCompensation(
    complaintId: string,
    data: CreateCompensationRequest,
    operatorRole: UserRole,
    operatorName: string
  ): Complaint | null {
    const complaint = complaintRepository.findById(complaintId);
    if (!complaint) return null;

    compensationRepository.create(complaintId, data);

    actionLogRepository.create(complaintId, {
      actionType: 'compensation_propose',
      operatorRole,
      operatorName,
      remark: `提出补偿方案: ${data.description}`,
    });

    complaintRepository.updateStatus(complaintId, 'pending_compensation', 'manager', '王店长');

    return this.getComplaintWithDetails(complaintId);
  }

  updateComplaint(id: string, data: Partial<CreateComplaintRequest>): Complaint | null {
    complaintRepository.update(id, data);
    return this.getComplaintWithDetails(id);
  }
}

export default new ComplaintService();
