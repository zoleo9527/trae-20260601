import { getData } from "../data/store.js";
import { addLog } from "./logService.js";
import type { LoadingBatch } from "../../shared/types.js";

export const getLoadingBatches = (status?: string): LoadingBatch[] => {
  const { loadingBatches } = getData();
  if (status && status !== "all") {
    return loadingBatches.filter((b) => b.status === status);
  }
  return loadingBatches;
};

export const getLoadingBatchById = (id: string): LoadingBatch | undefined => {
  const { loadingBatches } = getData();
  return loadingBatches.find((b) => b.id === id);
};

export const confirmLoading = (
  batchId: string,
  confirmer: string = "钱主管",
  confirmed: boolean = true,
): LoadingBatch | null => {
  const { loadingBatches, orders } = getData();
  const batch = loadingBatches.find((b) => b.id === batchId);

  if (!batch) return null;

  batch.status = confirmed ? "confirmed" : "rejected";
  batch.statusText = confirmed ? "已确认" : "已退回";
  batch.confirmedAt = new Date().toISOString();
  batch.confirmer = confirmer;
  batch.inspectionChanged = false;

  const order = orders.find((o) => o.id === batch.orderId);
  if (order && confirmed) {
    order.status = "completed";
    order.statusText = "已完成";
    order.updatedAt = new Date().toISOString();
  }

  addLog({
    operator: confirmer,
    operatorRole: "packaging",
    operatorRoleText: "包装主管",
    action: confirmed ? "loading_confirm" : "loading_reject",
    actionText: confirmed ? "装车复核通过" : "装车复核退回",
    targetType: "loading",
    targetId: batch.id,
    targetName: `${batch.batchNo} / ${batch.flowerType}`,
    description: confirmed
      ? "装车复核通过，确认出库"
      : "装车复核退回，需要重新处理",
  });

  return batch;
};

export const acknowledgeInspectionChange = (
  batchId: string,
  operator: string = '钱主管',
): LoadingBatch | null => {
  const { loadingBatches } = getData();
  const batch = loadingBatches.find(b => b.id === batchId);

  if (!batch) return null;

  batch.inspectionChanged = false;

  addLog({
    operator,
    operatorRole: 'packaging',
    operatorRoleText: '包装主管',
    action: 'inspection_change_acknowledged',
    actionText: '质检变更已读',
    targetType: 'loading',
    targetId: batch.id,
    targetName: `${batch.batchNo} / ${batch.flowerType}`,
    description: '已确认质检变更，清除高亮',
  });

  return batch;
};
