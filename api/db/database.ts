import { nanoid } from 'nanoid';
import type {
  Prescription,
  DeliveryInfo,
  StatusLog,
  OperationLog,
  PrescriptionStatus,
  Role,
} from '../../shared/types';
import { ROLE_TODO_STATUSES, ROLE_HISTORY_STATUSES } from '../../shared/types';

class Database {
  private prescriptions: Map<string, Prescription> = new Map();
  private deliveryInfos: Map<string, DeliveryInfo> = new Map();
  private statusLogs: Map<string, StatusLog> = new Map();
  private operationLogs: Map<string, OperationLog> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const now = new Date();
    const mockPrescriptions: Prescription[] = [
      {
        id: 'rx-001',
        prescriptionNo: 'CF20260601001',
        patientName: '张三',
        patientAge: 45,
        patientGender: '男',
        diagnosis: '脾胃虚弱',
        prescriptionContent: '黄芪30g, 党参20g, 白术15g, 茯苓15g, 炙甘草10g, 陈皮10g, 半夏10g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'PENDING_REVIEW',
        createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
      },
      {
        id: 'rx-002',
        prescriptionNo: 'CF20260601002',
        patientName: '李四',
        patientAge: 32,
        patientGender: '女',
        diagnosis: '气血不足',
        prescriptionContent: '当归15g, 熟地黄20g, 白芍15g, 川芎10g, 黄芪25g, 枸杞子15g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'PENDING_DECOCTION',
        createdAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 3).toISOString(),
      },
      {
        id: 'rx-003',
        prescriptionNo: 'CF20260601003',
        patientName: '王五',
        patientAge: 58,
        patientGender: '男',
        diagnosis: '高血压',
        prescriptionContent: '天麻15g, 钩藤15g, 石决明30g, 黄芩12g, 栀子10g, 杜仲15g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'PENDING_DELIVERY',
        createdAt: new Date(now.getTime() - 3600000 * 8).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
      },
      {
        id: 'rx-004',
        prescriptionNo: 'CF20260601004',
        patientName: '赵六',
        patientAge: 28,
        patientGender: '女',
        diagnosis: '失眠多梦',
        prescriptionContent: '酸枣仁30g, 柏子仁20g, 远志15g, 茯神20g, 合欢皮15g, 夜交藤30g',
        dosage: '每日1剂，睡前1小时服用',
        currentStatus: 'OUT_FOR_DELIVERY',
        createdAt: new Date(now.getTime() - 3600000 * 12).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
      },
      {
        id: 'rx-005',
        prescriptionNo: 'CF20260601005',
        patientName: '孙七',
        patientAge: 67,
        patientGender: '男',
        diagnosis: '糖尿病',
        prescriptionContent: '黄芪30g, 山药20g, 天花粉15g, 葛根20g, 枸杞子15g, 五味子10g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'DELIVERED',
        createdAt: new Date(now.getTime() - 3600000 * 24).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
      },
      {
        id: 'rx-006',
        prescriptionNo: 'CF20260601006',
        patientName: '周八',
        patientAge: 41,
        patientGender: '男',
        diagnosis: '腰椎间盘突出',
        prescriptionContent: '独活15g, 桑寄生20g, 杜仲15g, 牛膝15g, 当归15g, 红花10g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'COMPLETED',
        createdAt: new Date(now.getTime() - 3600000 * 48).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 12).toISOString(),
      },
      {
        id: 'rx-007',
        prescriptionNo: 'CF20260601007',
        patientName: '吴九',
        patientAge: 35,
        patientGender: '女',
        diagnosis: '月经不调',
        prescriptionContent: '当归15g, 川芎10g, 白芍15g, 熟地黄20g, 香附12g, 益母草15g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'RETURNED',
        createdAt: new Date(now.getTime() - 3600000 * 36).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 6).toISOString(),
      },
      {
        id: 'rx-008',
        prescriptionNo: 'CF20260601008',
        patientName: '郑十',
        patientAge: 52,
        patientGender: '男',
        diagnosis: '慢性胃炎',
        prescriptionContent: '党参20g, 白术15g, 茯苓15g, 炙甘草10g, 陈皮10g, 半夏12g',
        dosage: '每日1剂，水煎服，分2次温服',
        currentStatus: 'PENDING_REVIEW',
        createdAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
        updatedAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
      },
    ];

    mockPrescriptions.forEach((rx) => {
      this.prescriptions.set(rx.id, rx);
    });

    const deliveryInfo004: DeliveryInfo = {
      id: 'del-004',
      prescriptionId: 'rx-004',
      courierCompany: '顺丰速运',
      trackingNo: 'SF1234567890123',
      deliveryRemark: '患者要求优先配送，内附煎药说明',
      createdAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
    };
    this.deliveryInfos.set('del-004', deliveryInfo004);

    const deliveryInfo005: DeliveryInfo = {
      id: 'del-005',
      prescriptionId: 'rx-005',
      courierCompany: '京东物流',
      trackingNo: 'JD9876543210987',
      deliveryRemark: '请送达后电话联系',
      signedAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
      signResult: 'NORMAL',
      supplementaryRemark: '患者家属签收，确认无误',
      createdAt: new Date(now.getTime() - 3600000 * 20).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
    };
    this.deliveryInfos.set('del-005', deliveryInfo005);

    const deliveryInfo006: DeliveryInfo = {
      id: 'del-006',
      prescriptionId: 'rx-006',
      courierCompany: '顺丰速运',
      trackingNo: 'SF1122334455667',
      deliveryRemark: '常规配送',
      signedAt: new Date(now.getTime() - 3600000 * 14).toISOString(),
      signResult: 'NORMAL',
      supplementaryRemark: '本人签收',
      createdAt: new Date(now.getTime() - 3600000 * 36).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 12).toISOString(),
    };
    this.deliveryInfos.set('del-006', deliveryInfo006);

    const deliveryInfo007: DeliveryInfo = {
      id: 'del-007',
      prescriptionId: 'rx-007',
      courierCompany: '圆通速递',
      trackingNo: 'YT5566778899001',
      deliveryRemark: '注意包装防压',
      signedAt: new Date(now.getTime() - 3600000 * 8).toISOString(),
      signResult: 'RETURNED',
      returnType: '拒收',
      returnReason: '患者电话联系不上，地址无人接收',
      supplementaryRemark: '已联系药房，待确认处理方案',
      createdAt: new Date(now.getTime() - 3600000 * 24).toISOString(),
      updatedAt: new Date(now.getTime() - 3600000 * 6).toISOString(),
    };
    this.deliveryInfos.set('del-007', deliveryInfo007);

    this.addStatusLog('rx-001', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-002', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-002', 'PENDING_REVIEW', 'REVIEWED', 'PHARMACIST', '李药师', '审核通过，处方合理');
    this.addStatusLog('rx-002', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    this.addStatusLog('rx-003', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-003', 'PENDING_REVIEW', 'REVIEWED', 'PHARMACIST', '王药师', '审核通过');
    this.addStatusLog('rx-003', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    this.addStatusLog('rx-003', 'PENDING_DECOCTION', 'DECOCTED', 'DECOCTION_STAFF', '张师傅', '煎药完成，已装袋');
    this.addStatusLog('rx-003', 'DECOCTED', 'PENDING_DELIVERY', 'DELIVERY_STAFF', '系统', '转入待配送');
    this.addStatusLog('rx-004', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-004', 'PENDING_REVIEW', 'REVIEWED', 'PHARMACIST', '李药师', '审核通过');
    this.addStatusLog('rx-004', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    this.addStatusLog('rx-004', 'PENDING_DECOCTION', 'DECOCTED', 'DECOCTION_STAFF', '王师傅', '煎药完成');
    this.addStatusLog('rx-004', 'DECOCTED', 'PENDING_DELIVERY', 'DELIVERY_STAFF', '系统', '转入待配送');
    this.addStatusLog('rx-004', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_STAFF', '陈客服', '已安排配送');
    this.addStatusLog('rx-005', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-005', 'PENDING_REVIEW', 'REVIEWED', 'PHARMACIST', '张药师', '审核通过');
    this.addStatusLog('rx-005', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    this.addStatusLog('rx-005', 'PENDING_DECOCTION', 'DECOCTED', 'DECOCTION_STAFF', '李师傅', '煎药完成');
    this.addStatusLog('rx-005', 'DECOCTED', 'PENDING_DELIVERY', 'DELIVERY_STAFF', '系统', '转入待配送');
    this.addStatusLog('rx-005', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_STAFF', '陈客服', '已发货');
    this.addStatusLog('rx-005', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_STAFF', '陈客服', '已签收');
    this.addStatusLog('rx-005', 'DELIVERED', 'COMPLETED', 'DELIVERY_STAFF', '系统', '订单完成');
    this.addStatusLog('rx-006', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-006', 'PENDING_REVIEW', 'REVIEWED', 'PHARMACIST', '王药师', '审核通过');
    this.addStatusLog('rx-006', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    this.addStatusLog('rx-006', 'PENDING_DECOCTION', 'DECOCTED', 'DECOCTION_STAFF', '张师傅', '煎药完成');
    this.addStatusLog('rx-006', 'DECOCTED', 'PENDING_DELIVERY', 'DELIVERY_STAFF', '系统', '转入待配送');
    this.addStatusLog('rx-006', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_STAFF', '陈客服', '已发货');
    this.addStatusLog('rx-006', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_STAFF', '陈客服', '已签收');
    this.addStatusLog('rx-006', 'DELIVERED', 'COMPLETED', 'DELIVERY_STAFF', '系统', '订单完成');
    this.addStatusLog('rx-007', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addStatusLog('rx-007', 'PENDING_REVIEW', 'REVIEWED', 'PHARMACIST', '李药师', '审核通过');
    this.addStatusLog('rx-007', 'REVIEWED', 'PENDING_DECOCTION', 'DECOCTION_STAFF', '系统', '转入待煎药');
    this.addStatusLog('rx-007', 'PENDING_DECOCTION', 'DECOCTED', 'DECOCTION_STAFF', '王师傅', '煎药完成');
    this.addStatusLog('rx-007', 'DECOCTED', 'PENDING_DELIVERY', 'DELIVERY_STAFF', '系统', '转入待配送');
    this.addStatusLog('rx-007', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_STAFF', '陈客服', '已发货');
    this.addStatusLog('rx-007', 'OUT_FOR_DELIVERY', 'RETURNED', 'DELIVERY_STAFF', '陈客服', '已退回');
    this.addStatusLog('rx-008', null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');

    this.addOperationLog('rx-003', '审核处方', 'PHARMACIST', '王药师', '处方审核通过，配伍合理，用量适宜');
    this.addOperationLog('rx-003', '煎药完成', 'DECOCTION_STAFF', '张师傅', '共煎7剂，每剂分装2袋，已冷藏保存');
    this.addOperationLog('rx-004', '审核处方', 'PHARMACIST', '李药师', '处方审核通过，注意酸枣仁需捣碎');
    this.addOperationLog('rx-004', '煎药完成', 'DECOCTION_STAFF', '王师傅', '睡前服用类药物，已单独标注');
    this.addOperationLog('rx-004', '配送出库', 'DELIVERY_STAFF', '陈客服', '顺丰速运 SF1234567890123，患者要求优先配送');
    this.addOperationLog('rx-005', '审核处方', 'PHARMACIST', '张药师', '审核通过，糖尿病患者用药注意事项已告知');
    this.addOperationLog('rx-005', '煎药完成', 'DECOCTION_STAFF', '李师傅', '煎药完成，无糖型包装');
    this.addOperationLog('rx-005', '配送出库', 'DELIVERY_STAFF', '陈客服', '京东物流 JD9876543210987');
    this.addOperationLog('rx-005', '签收确认', 'DELIVERY_STAFF', '陈客服', '患者家属签收，确认无误');
    this.addOperationLog('rx-007', '配送出库', 'DELIVERY_STAFF', '陈客服', '圆通速递 YT5566778899001');
    this.addOperationLog('rx-007', '签收确认', 'DELIVERY_STAFF', '陈客服', '退回原因：患者电话联系不上，地址无人接收。已联系药房待处理');
  }

  generateId(): string {
    return nanoid(12);
  }

  getAllPrescriptions(): Prescription[] {
    return Array.from(this.prescriptions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getPrescriptionsByStatus(statuses: PrescriptionStatus[]): Prescription[] {
    return this.getAllPrescriptions().filter((rx) => statuses.includes(rx.currentStatus));
  }

  getPrescriptionsByRole(role: Role): Prescription[] {
    return this.getPrescriptionsByStatus(ROLE_TODO_STATUSES[role]);
  }

  getHistoryByRole(role: Role): Prescription[] {
    return this.getPrescriptionsByStatus(ROLE_HISTORY_STATUSES[role]);
  }

  getPrescriptionById(id: string): Prescription | undefined {
    return this.prescriptions.get(id);
  }

  createPrescription(data: Omit<Prescription, 'id' | 'prescriptionNo' | 'currentStatus' | 'createdAt' | 'updatedAt'>): Prescription {
    const now = new Date().toISOString();
    const count = this.prescriptions.size + 1;
    const prescription: Prescription = {
      ...data,
      id: this.generateId(),
      prescriptionNo: `CF${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(count).padStart(3, '0')}`,
      currentStatus: 'PENDING_REVIEW',
      createdAt: now,
      updatedAt: now,
    };
    this.prescriptions.set(prescription.id, prescription);
    this.addStatusLog(prescription.id, null, 'PENDING_REVIEW', 'PHARMACIST', '系统', '处方创建');
    this.addOperationLog(prescription.id, '创建处方', 'PHARMACIST', '系统', `处方 ${prescription.prescriptionNo} 创建成功`);
    return prescription;
  }

  updatePrescriptionStatus(id: string, newStatus: PrescriptionStatus): Prescription | undefined {
    const rx = this.prescriptions.get(id);
    if (!rx) return undefined;
    const updated = { ...rx, currentStatus: newStatus, updatedAt: new Date().toISOString() };
    this.prescriptions.set(id, updated);
    return updated;
  }

  getDeliveryInfoByPrescriptionId(prescriptionId: string): DeliveryInfo | undefined {
    return Array.from(this.deliveryInfos.values()).find((d) => d.prescriptionId === prescriptionId);
  }

  createDeliveryInfo(data: Omit<DeliveryInfo, 'id' | 'createdAt' | 'updatedAt'>): DeliveryInfo {
    const now = new Date().toISOString();
    const deliveryInfo: DeliveryInfo = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.deliveryInfos.set(deliveryInfo.id, deliveryInfo);
    return deliveryInfo;
  }

  updateDeliveryInfo(id: string, data: Partial<DeliveryInfo>): DeliveryInfo | undefined {
    const info = this.deliveryInfos.get(id);
    if (!info) return undefined;
    const updated = { ...info, ...data, updatedAt: new Date().toISOString() };
    this.deliveryInfos.set(id, updated);
    return updated;
  }

  addStatusLog(
    prescriptionId: string,
    fromStatus: PrescriptionStatus | null,
    toStatus: PrescriptionStatus,
    operatorRole: Role,
    operatorName: string,
    remark: string
  ): StatusLog {
    const log: StatusLog = {
      id: this.generateId(),
      prescriptionId,
      fromStatus,
      toStatus,
      operatorRole,
      operatorName,
      remark,
      createdAt: new Date().toISOString(),
    };
    this.statusLogs.set(log.id, log);
    return log;
  }

  getStatusLogsByPrescriptionId(prescriptionId: string): StatusLog[] {
    return Array.from(this.statusLogs.values())
      .filter((l) => l.prescriptionId === prescriptionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addOperationLog(
    prescriptionId: string,
    operationType: string,
    operatorRole: Role,
    operatorName: string,
    content: string
  ): OperationLog {
    const log: OperationLog = {
      id: this.generateId(),
      prescriptionId,
      operationType,
      operatorRole,
      operatorName,
      content,
      createdAt: new Date().toISOString(),
    };
    this.operationLogs.set(log.id, log);
    return log;
  }

  getOperationLogsByPrescriptionId(prescriptionId: string): OperationLog[] {
    return Array.from(this.operationLogs.values())
      .filter((l) => l.prescriptionId === prescriptionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const db = new Database();
