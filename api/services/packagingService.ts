import { getData, generateId } from '../data/store.js';
import { addLog } from './logService.js';
import type { PackagingBatch, InspectionResult } from '../../shared/types.js';

interface InspectionSubmitData {
  qualifiedQty: number;
  damagedQty: number;
  damageReasons: string[];
  remark?: string;
  inspector: string;
}

export const getPackagingBatches = (status?: string): PackagingBatch[] => {
  const { packagingBatches } = getData();
  if (status && status !== 'all') {
    return packagingBatches.filter(b => b.status === status);
  }
  return packagingBatches;
};

export const getPackagingBatchById = (id: string): PackagingBatch | undefined => {
  const { packagingBatches } = getData();
  return packagingBatches.find(b => b.id === id);
};

export const submitInspection = (
  batchId: string,
  data: InspectionSubmitData,
): { batch: PackagingBatch; result: InspectionResult } | null => {
  const { packagingBatches, inspectionResults, loadingBatches, orders } = getData();
  const batch = packagingBatches.find(b => b.id === batchId);

  if (!batch) return null;

  const order = orders.find(o => o.id === batch.orderId);

  const result: InspectionResult = {
    id: generateId('insp'),
    batchId,
    qualifiedQty: data.qualifiedQty,
    damagedQty: data.damagedQty,
    damageReasons: data.damageReasons,
    remark: data.remark,
    inspector: data.inspector,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  inspectionResults.push(result);

  batch.status = 'inspected';
  batch.statusText = '已质检';
  batch.inspector = data.inspector;
  batch.inspectedAt = new Date().toISOString();
  batch.inspectionResult = result;
  batch.actualQuantity = data.qualifiedQty + data.damagedQty;
  batch.inspectionChanged = false;

  const loadingBatch = loadingBatches.find(lb => lb.batchId === batchId);
  if (loadingBatch) {
    loadingBatch.qualifiedQty = data.qualifiedQty;
    loadingBatch.damagedQty = data.damagedQty;
    loadingBatch.damageReasons = data.damageReasons;
    loadingBatch.inspectionStatus = data.damagedQty > 0 ? 'damaged' : 'qualified';
    loadingBatch.inspectionStatusText = data.damagedQty > 0 ? '有破损' : '质检合格';
    loadingBatch.inspectionRemark = data.remark;
    loadingBatch.inspectionChanged = false;
    loadingBatch.inspectionVersion = 1;
  } else {
    loadingBatches.push({
      id: generateId('load'),
      batchId: batch.id,
      batchNo: batch.batchNo,
      orderId: batch.orderId,
      orderNo: batch.orderNo,
      customer: batch.customer,
      flowerType: batch.flowerType,
      spec: batch.spec,
      quantity: batch.planQuantity,
      qualifiedQty: data.qualifiedQty,
      damagedQty: data.damagedQty,
      damageReasons: data.damageReasons,
      inspectionStatus: data.damagedQty > 0 ? 'damaged' : 'qualified',
      inspectionStatusText: data.damagedQty > 0 ? '有破损' : '质检合格',
      inspectionChanged: false,
      inspectionRemark: data.remark,
      inspectionVersion: 1,
      status: 'pending',
      statusText: '待复核',
      deliveryDate: order?.deliveryDate || '',
      createdAt: new Date().toISOString(),
    });
  }

  if (order) {
    order.status = 'inspected';
    order.statusText = '已质检';
    order.updatedAt = new Date().toISOString();
  }

  addLog({
    operator: data.inspector,
    operatorRole: 'packaging',
    operatorRoleText: '包装主管',
    action: 'inspection_submit',
    actionText: '提交质检结果',
    targetType: 'batch',
    targetId: batch.id,
    targetName: `${batch.batchNo} / ${batch.flowerType}`,
    description: `完成质检，合格${data.qualifiedQty}枝，破损${data.damagedQty}枝`,
  });

  return { batch, result };
};

export const updateInspection = (
  batchId: string,
  data: InspectionSubmitData,
): { batch: PackagingBatch; result: InspectionResult } | null => {
  const { packagingBatches, inspectionResults, loadingBatches } = getData();
  const batch = packagingBatches.find(b => b.id === batchId);

  if (!batch || !batch.inspectionResult) return null;

  const oldResult = batch.inspectionResult;

  const snapshot = {
    qualifiedQty: oldResult.qualifiedQty,
    damagedQty: oldResult.damagedQty,
    damageReasons: [...oldResult.damageReasons],
    remark: oldResult.remark,
    version: oldResult.version,
  };

  const oldQualified = snapshot.qualifiedQty;
  const oldDamaged = snapshot.damagedQty;
  const oldReasons = snapshot.damageReasons.join(', ');

  const result = inspectionResults.find(r => r.id === oldResult.id);
  if (!result) return null;

  result.qualifiedQty = data.qualifiedQty;
  result.damagedQty = data.damagedQty;
  result.damageReasons = data.damageReasons;
  result.remark = data.remark;
  result.updatedAt = new Date().toISOString();
  result.version += 1;

  batch.inspectionResult = result;
  batch.inspector = data.inspector;
  batch.inspectedAt = new Date().toISOString();
  batch.inspectionChanged = true;
  batch.lastInspectionChange = new Date().toISOString();
  batch.actualQuantity = data.qualifiedQty + data.damagedQty;

  const loadingBatch = loadingBatches.find(lb => lb.batchId === batchId);
  if (loadingBatch) {
    loadingBatch.previousInspection = {
      qualifiedQty: snapshot.qualifiedQty,
      damagedQty: snapshot.damagedQty,
      damageReasons: snapshot.damageReasons,
      remark: snapshot.remark,
      version: snapshot.version,
      changedAt: new Date().toISOString(),
    };
    loadingBatch.qualifiedQty = data.qualifiedQty;
    loadingBatch.damagedQty = data.damagedQty;
    loadingBatch.damageReasons = data.damageReasons;
    loadingBatch.inspectionStatus = data.damagedQty > 0 ? 'damaged' : 'qualified';
    loadingBatch.inspectionStatusText = data.damagedQty > 0 ? '有破损' : '质检合格';
    loadingBatch.inspectionRemark = data.remark;
    loadingBatch.inspectionChanged = true;
    loadingBatch.lastInspectionChange = new Date().toISOString();
    loadingBatch.inspectionVersion = result.version;
  }

  const changes: { field: string; fieldText: string; oldValue: string; newValue: string }[] = [];

  if (oldQualified !== data.qualifiedQty) {
    changes.push({
      field: 'qualifiedQty',
      fieldText: '合格数量',
      oldValue: `${oldQualified} 枝`,
      newValue: `${data.qualifiedQty} 枝`,
    });
  }
  if (oldDamaged !== data.damagedQty) {
    changes.push({
      field: 'damagedQty',
      fieldText: '破损数量',
      oldValue: `${oldDamaged} 枝`,
      newValue: `${data.damagedQty} 枝`,
    });
  }

  const newReasons = data.damageReasons.join(', ');
  if (oldReasons !== newReasons) {
    changes.push({
      field: 'damageReasons',
      fieldText: '破损原因',
      oldValue: oldReasons || '无',
      newValue: newReasons || '无',
    });
  }

  if (snapshot.remark !== data.remark) {
    changes.push({
      field: 'remark',
      fieldText: '备注',
      oldValue: snapshot.remark || '无',
      newValue: data.remark || '无',
    });
  }

  addLog({
    operator: data.inspector,
    operatorRole: 'packaging',
    operatorRoleText: '包装主管',
    action: 'inspection_update',
    actionText: '修改质检结果',
    targetType: 'batch',
    targetId: batch.id,
    targetName: `${batch.batchNo} / ${batch.flowerType}`,
    description: `修改质检结果，合格${oldQualified}→${data.qualifiedQty}枝，破损${oldDamaged}→${data.damagedQty}枝`,
    changes,
  });

  return { batch, result };
};
