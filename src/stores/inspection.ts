import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Inspection,
  Dispatch,
  RectificationStats,
  CreateInspectionRequest,
  CreateDispatchRequest,
  UpdateDispatchRequest,
  ReviewRequest,
  RiskLevel,
  InspectionStatus
} from '../types/index.js';
import { inspectionApi, dispatchApi, rectificationApi } from '../utils/api.js';

export const useInspectionStore = defineStore('inspection', () => {
  const inspections = ref<Inspection[]>([]);
  const currentInspection = ref<Inspection | null>(null);
  const dispatches = ref<Dispatch[]>([]);
  const stats = ref<RectificationStats | null>(null);
  const pendingReviews = ref<Inspection[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const sortedInspections = computed(() => {
    return [...inspections.value].sort((a, b) =>
      new Date(b.discoveryTime).getTime() - new Date(a.discoveryTime).getTime()
    );
  });

  const pendingReviewCount = computed(() => pendingReviews.value.length);

  async function fetchInspections(filters?: {
    riskLevel?: RiskLevel;
    status?: InspectionStatus;
    facilityType?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      inspections.value = await inspectionApi.getInspections(filters);
    } catch (err) {
      error.value = '获取抽检列表失败';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchInspectionById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      currentInspection.value = await inspectionApi.getInspectionById(id);
    } catch (err) {
      error.value = '获取隐患详情失败';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function createInspection(data: CreateInspectionRequest) {
    loading.value = true;
    error.value = null;
    try {
      const newInspection = await inspectionApi.createInspection(data);
      inspections.value.unshift(newInspection);
      return newInspection;
    } catch (err) {
      error.value = '创建抽检记录失败';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateInspectionStatus(id: string, status: InspectionStatus, remark?: string) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await inspectionApi.updateStatus(id, status, remark);
      const index = inspections.value.findIndex(i => i.id === id);
      if (index !== -1) {
        inspections.value[index] = updated;
      }
      if (currentInspection.value?.id === id) {
        currentInspection.value = updated;
      }
      return updated;
    } catch (err) {
      error.value = '更新状态失败';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDispatches() {
    loading.value = true;
    error.value = null;
    try {
      dispatches.value = await dispatchApi.getAllDispatches();
    } catch (err) {
      error.value = '获取派发记录失败';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function createDispatch(data: CreateDispatchRequest) {
    loading.value = true;
    error.value = null;
    try {
      const newDispatch = await dispatchApi.createDispatch(data);
      dispatches.value.unshift(newDispatch);
      await fetchInspections();
      if (currentInspection.value?.id === data.inspectionId) {
        await fetchInspectionById(data.inspectionId);
      }
      return newDispatch;
    } catch (err) {
      error.value = '派发失败';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateDispatch(id: string, data: UpdateDispatchRequest) {
    loading.value = true;
    error.value = null;
    try {
      const updated = await dispatchApi.updateDispatch(id, data);
      const index = dispatches.value.findIndex(d => d.id === id);
      if (index !== -1) {
        dispatches.value[index] = updated;
      }
      await fetchInspections();
      if (currentInspection.value?.id === updated.inspectionId) {
        await fetchInspectionById(updated.inspectionId);
      }
      return updated;
    } catch (err) {
      error.value = '更新派发记录失败';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    loading.value = true;
    error.value = null;
    try {
      stats.value = await rectificationApi.getStats();
    } catch (err) {
      error.value = '获取统计数据失败';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchPendingReviews() {
    loading.value = true;
    error.value = null;
    try {
      pendingReviews.value = await inspectionApi.getPendingReviews();
    } catch (err) {
      error.value = '获取待复查列表失败';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function submitReview(data: ReviewRequest) {
    loading.value = true;
    error.value = null;
    try {
      await rectificationApi.submitReview(data);
      await fetchInspections();
      await fetchPendingReviews();
      await fetchStats();
      if (currentInspection.value?.id === data.inspectionId) {
        await fetchInspectionById(data.inspectionId);
      }
    } catch (err) {
      error.value = '提交复查结果失败';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearCurrentInspection() {
    currentInspection.value = null;
  }

  return {
    inspections,
    currentInspection,
    dispatches,
    stats,
    pendingReviews,
    loading,
    error,
    sortedInspections,
    pendingReviewCount,
    fetchInspections,
    fetchInspectionById,
    createInspection,
    updateInspectionStatus,
    fetchDispatches,
    createDispatch,
    updateDispatch,
    fetchStats,
    fetchPendingReviews,
    submitReview,
    clearCurrentInspection
  };
});
