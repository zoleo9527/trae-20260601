import { db } from '../db/database';
import type {
  Prescription,
  PrescriptionDetail,
  PrescriptionStatus,
  Role,
  CreatePrescriptionRequest,
  ReviewRequest,
  DecoctRequest,
  DeliveryRequest,
  SignRequest,
  RoleTodoCount,
} from '../../shared/types';
import { ROLE_TODO_STATUSES } from '../../shared/types';

class PrescriptionService {
  async getAllPrescriptions(status?: PrescriptionStatus): Promise<Prescription[]> {
    if (status) {
      return db.getPrescriptionsByStatus([status]);
    }
    return db.getAllPrescriptions();
  }

  async getByRole(role: Role): Promise<Prescription[]> {
    return db.getPrescriptionsByRole(role);
  }

  async getHistoryByRole(role: Role): Promise<Prescription[]> {
    return db.getHistoryByRole(role);
  }

  async getTodoCountByRole(role: Role): Promise<RoleTodoCount> {
    const all = db.getAllPrescriptions();
    const count = {
      PENDING_REVIEW: all.filter((p) => p.currentStatus === 'PENDING_REVIEW').length,
      PENDING_DECOCTION: all.filter((p) => p.currentStatus === 'PENDING_DECOCTION').length,
      PENDING_DELIVERY: all.filter((p) => p.currentStatus === 'PENDING_DELIVERY').length,
      OUT_FOR_DELIVERY: all.filter((p) => p.currentStatus === 'OUT_FOR_DELIVERY').length,
      RETURNED: all.filter((p) => p.currentStatus === 'RETURNED').length,
      TOTAL: 0,
    };
    count.TOTAL = count.PENDING_REVIEW + count.PENDING_DECOCTION + count.PENDING_DELIVERY + count.OUT_FOR_DELIVERY + count.RETURNED;
    return count;
  }

  async getDetail(id: string): Promise<PrescriptionDetail | null> {
    const prescription = db.getPrescriptionById(id);
    if (!prescription) return null;

    const deliveryInfo = db.getDeliveryInfoByPrescriptionId(id);
    const statusLogs = db.getStatusLogsByPrescriptionId(id);
    const operationLogs = db.getOperationLogsByPrescriptionId(id);

    return {
      ...prescription,
      deliveryInfo,
      statusLogs,
      operationLogs,
    };
  }

  async create(data: CreatePrescriptionRequest): Promise<Prescription> {
    return db.createPrescription(data);
  }

  async review(id: string, data: ReviewRequest): Promise<PrescriptionDetail | null> {
    const rx = db.getPrescriptionById(id);
    if (!rx || rx.currentStatus !== 'PENDING_REVIEW') return null;

    db.addStatusLog(id, rx.currentStatus, 'REVIEWED', 'PHARMACIST', data.operatorName, data.remark);
    db.addOperationLog(id, '审核处方', 'PHARMACIST', data.operatorName, data.remark || '审核通过');
    db.updatePrescriptionStatus(id, 'REVIEWED');

    db.addStatusLog(id, 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    db.addOperationLog(id, '状态变更', 'PHARMACIST', '系统', '处方已转入待煎药队列');
    db.updatePrescriptionStatus(id, 'PENDING_DECOCTION');

    return this.getDetail(id);
  }

  async decoct(id: string, data: DecoctRequest): Promise<PrescriptionDetail | null> {
    const rx = db.getPrescriptionById(id);
    if (!rx || rx.currentStatus !== 'PENDING_DECOCTION') return null;

    db.addStatusLog(id, rx.currentStatus, 'DECOCTED', 'DECOCTION_STAFF', data.operatorName, data.remark);
    db.addOperationLog(id, '煎药完成', 'DECOCTION_STAFF', data.operatorName, data.remark || '煎药完成');
    db.updatePrescriptionStatus(id, 'DECOCTED');

    db.addStatusLog(id, 'DECOCTED', 'PENDING_DELIVERY', 'DELIVERY_STAFF', '系统', '转入待配送');
    db.addOperationLog(id, '状态变更', 'DECOCTION_STAFF', '系统', '处方已转入待配送队列');
    db.updatePrescriptionStatus(id, 'PENDING_DELIVERY');

    return this.getDetail(id);
  }

  async delivery(id: string, data: DeliveryRequest): Promise<PrescriptionDetail | null> {
    const rx = db.getPrescriptionById(id);
    if (!rx || (rx.currentStatus !== 'PENDING_DELIVERY' && rx.currentStatus !== 'RETURNED')) return null;

    const existingDelivery = db.getDeliveryInfoByPrescriptionId(id);

    if (existingDelivery && rx.currentStatus === 'RETURNED') {
      db.updateDeliveryInfo(existingDelivery.id, {
        courierCompany: data.courierCompany,
        trackingNo: data.trackingNo,
        deliveryRemark: data.deliveryRemark
          ? `${existingDelivery.deliveryRemark ? existingDelivery.deliveryRemark + ' | ' : ''}重新配送：${data.deliveryRemark}`
          : existingDelivery.deliveryRemark,
        signResult: undefined,
        signedAt: undefined,
        returnType: undefined,
        returnReason: undefined,
        supplementaryRemark: undefined,
      });
    } else {
      db.createDeliveryInfo({
        prescriptionId: id,
        courierCompany: data.courierCompany,
        trackingNo: data.trackingNo,
        deliveryRemark: data.deliveryRemark,
      });
    }

    db.addStatusLog(id, rx.currentStatus, 'OUT_FOR_DELIVERY', 'DELIVERY_STAFF', data.operatorName, rx.currentStatus === 'RETURNED' ? `重新配送：${data.deliveryRemark || '重新安排配送'}` : data.deliveryRemark);
    db.addOperationLog(
      id,
      rx.currentStatus === 'RETURNED' ? '重新配送' : '配送出库',
      'DELIVERY_STAFF',
      data.operatorName,
      `${data.courierCompany} ${data.trackingNo}${data.deliveryRemark ? '，' + data.deliveryRemark : ''}`
    );
    db.updatePrescriptionStatus(id, 'OUT_FOR_DELIVERY');

    return this.getDetail(id);
  }

  async sign(id: string, data: SignRequest): Promise<PrescriptionDetail | null> {
    const rx = db.getPrescriptionById(id);
    if (!rx || rx.currentStatus !== 'OUT_FOR_DELIVERY') return null;

    const deliveryInfo = db.getDeliveryInfoByPrescriptionId(id);
    if (!deliveryInfo) return null;

    const now = new Date().toISOString();

    if (data.signResult === 'NORMAL') {
      db.updateDeliveryInfo(deliveryInfo.id, {
        signResult: 'NORMAL',
        signedAt: now,
        supplementaryRemark: data.supplementaryRemark,
      });

      db.addStatusLog(id, rx.currentStatus, 'DELIVERED', 'DELIVERY_STAFF', data.operatorName, data.supplementaryRemark || '正常签收');
      db.addOperationLog(id, '签收确认', 'DELIVERY_STAFF', data.operatorName, data.supplementaryRemark || '正常签收');
      db.updatePrescriptionStatus(id, 'DELIVERED');

      db.addStatusLog(id, 'DELIVERED', 'COMPLETED', 'DELIVERY_STAFF', '系统', '订单完成');
      db.addOperationLog(id, '状态变更', 'DELIVERY_STAFF', '系统', '订单已完成');
      db.updatePrescriptionStatus(id, 'COMPLETED');
    } else {
      db.updateDeliveryInfo(deliveryInfo.id, {
        signResult: 'RETURNED',
        signedAt: now,
        returnType: data.returnType,
        returnReason: data.returnReason,
        supplementaryRemark: data.supplementaryRemark,
      });

      db.addStatusLog(
        id,
        rx.currentStatus,
        'RETURNED',
        'DELIVERY_STAFF',
        data.operatorName,
        `${data.returnType || '退回'}：${data.returnReason || ''}`
      );
      db.addOperationLog(
        id,
        '签收确认',
        'DELIVERY_STAFF',
        data.operatorName,
        `退回原因：${data.returnReason || ''}${data.supplementaryRemark ? '。' + data.supplementaryRemark : ''}`
      );
      db.updatePrescriptionStatus(id, 'RETURNED');
    }

    return this.getDetail(id);
  }
}

export const prescriptionService = new PrescriptionService();
